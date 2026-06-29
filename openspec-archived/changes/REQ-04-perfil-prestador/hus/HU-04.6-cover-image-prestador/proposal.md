# Propuesta — HU-04.6 — Cover image (hero) del prestador en R2

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

La foto de avatar (HU-04.3) cubre la identidad, pero el perfil público
(`/p/<slug>`) necesita un hero visual de mayor tamaño (1200x400) que
aporte presencia y mejore la conversión (matches con OE1). El prestador
sube una imagen, la plataforma la valida, resizea y persiste en R2 con
key `covers/<providerId>.<ext>`. Si no hay cover, fallback a un
gradiente verde del color primario para no romper el layout. El
reemplazo limpia el objeto anterior.

## Mockups de referencia

- `mockups/verification.html:26-36` — hero de la página de verificación con `bg-primary text-white py-16` + overlay `bg-cover bg-center opacity-10`. Estilo a replicar para el hero del perfil con cover.
- `mockups/dashboard-provider.html:72-75` — botón "Previsualizar Perfil Público" sirve de referencia para "Abrir/Cerrar preview del cover" en HU-04.4.
- `mockups/profile.html` — la página de perfil público donde el hero se renderiza (header con cover arriba del bloque bio+contacto).
- `mockups/js/data.js:25,53,81,110,131,150,171,211` — campo `coverImage` con URLs Unsplash 1200w (`w=1200`) usado por las cards mockeadas. Define el aspect ratio esperado.

## Alternativas consideradas

### Opcion A — Columna nueva `providers.cover_r2_key` + endpoint `POST /api/v1/providers/me/cover` + render en `/p/[slug].astro` con fallback gradient
- Migración `ALTER TABLE providers ADD COLUMN cover_r2_key TEXT`.
- Endpoint acepta `image/jpeg|png|webp`, ≤ 8 MB, resizea a 1200x400.
- Hero de `/p/[slug].astro` usa `cover_r2_key` como `background-image: url(...)` con `bg-cover bg-center`. Si es null, fallback `bg-gradient-to-r from-primary to-primary-dark`.
- Pro: columna nullable permite fallback graceful; sin cover el perfil sigue publicable.
- Pro: reutiliza helpers de HU-04.3 (`validateImageUpload`, `resizeImage`, `putMediaObject`, `deleteMediaObject`).
- Contra: agrega una columna a `providers`; convive con la foto sin conflicto.

### Opcion B — Reutilizar `photo_r2_key` con variants (`?w=1200&h=400`)
- Una sola imagen, el CDN la sirve en varios tamaños.
- Pro: una sola subida, sin endpoint adicional.
- Contra: avatar es cuadrado 256x256, cover es 16:5 — un resize con esa proporción degrada la imagen o la recorta mal. Pierde la libertad creativa del prestador para elegir un hero que NO sea su cara.

### Opcion C — Hero generado por composición server-side (cover + avatar superpuesto)
- Generar PNG 1200x400 con el avatar centrado + overlay de gradiente.
- Pro: look consistente garantizado.
- Contra: requiere librería de composición (canvas en Workers, pesado), enlentece el endpoint, ocupa más R2.

## Decision

Se elige **Opcion A**. Es la única que respeta la intención del
REQ-04 ("foto" + cover son piezas distintas) sin acoplarse a un CDN de
imágenes pago. Reutilizar el pipeline de HU-04.3 minimiza el código
nuevo: el helper `resizeImage(buffer, w, h)` parametrizable cubre
ambos casos.

## Riesgos y mitigaciones

- Riesgo: el fallback gradient se ve inconsistente entre páginas → Mitigación: definir utility class `bg-gradient-to-r from-primary to-primary-dark` en `tailwind.config` (ya existe como `primary` y `primary-dark`) y usarlo en `/p/[slug].astro` y en cualquier otra vista que muestre el hero de un perfil sin cover.
- Riesgo: cover pesa mucho y rompe el LCP de la página pública → Mitigación: resize a 1200x400 con `image-encode` JPEG q=80 (no q=85 como el avatar, porque la imagen es más grande); documentado en T2.
- Riesgo: prestador sube una imagen muy pequeña (< 1200x400) → Mitigación: NO rechazar — el `resizeImage` upscale + JPEG q=80 produce un resultado aceptable; documentado en design.
- Riesgo: el `ALTER TABLE` rompe ambientes donde la migración anterior ya aplicó → Mitigación: la columna se declara ya en el schema de HU-04.1 (con `text` nullable) para que no haya ALTER; HU-04.6 no necesita migración si HU-04.1 ya la creó.

## Metrica de exito

- `POST /api/v1/providers/me/cover` con `image/jpeg` 4 MB → 200 con `{ cover_r2_key: "covers/42.jpg" }`.
- Subir `application/pdf` → 415.
- Subir 9 MB → 413.
- Tras upload, `GET /p/<slug>` renderiza el cover como background del hero.
- Sin cover, `GET /p/<slug>` muestra el gradient verde.
- Reemplazo: `old.jpg` ya no existe en R2 tras subir nueva cover.
