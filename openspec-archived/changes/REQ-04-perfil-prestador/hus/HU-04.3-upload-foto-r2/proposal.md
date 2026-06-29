# Propuesta — HU-04.3 — Subida y resize de foto del prestador

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

La foto de avatar (256x256) es la pieza que más impacta la confianza del
vecino visitante (criterio 100% verificable: REQ-04 lo vincula a OE1).
El prestador sube un archivo (típicamente una foto de celular de 2-5 MB)
y la plataforma se encarga de: validar MIME, validar tamaño, resizear a
256x256 server-side, persistir en R2 y guardar la key en
`providers.photo_r2_key`. El reemplazo debe limpiar la versión anterior
para no acumular basura en el bucket.

## Mockups de referencia

- `mockups/dashboard-provider.html:100-110` — avatar con preview `id="avatar-preview"` + hover con `ri-camera-line` y grupo `cursor-pointer`. El handler `POST /photo` se dispara desde este control.
- `mockups/dashboard-provider.html:158-186` — galería de trabajos (5 slots, hover muestra `ri-delete-bin-line`). Estructura repetible: grid + slot vacío con dashed border.
- `mockups/index.html:324-326` — `class="avatar-container"` del grid card muestra `avatar-img` (mismo `photo_r2_key`).

## Alternativas consideradas

### Opcion A — Endpoint único `POST /api/v1/providers/me/photo` con multipart/form-data
- Body: archivo binario en `file`. Server: validar MIME (jpg/png/webp), tamaño máx 5 MB, resizear a 256x256 con `wasm-image-resize`, subir a R2 con key `avatars/<providerId>.<ext>`, persistir key.
- Pro: convención REST estándar, una sola request.
- Pro: resize server-side garantiza que la imagen servida siempre es 256x256 (no se depende del cliente).
- Contra: payload grande; en mobile con conexión lenta puede tardar.

### Opcion B — Subida directa a R2 desde el cliente con presigned URL
- Front pide URL firmada, sube directo a R2, luego `PATCH /api/v1/providers/me` con la key.
- Pro: alivia CPU del worker (no resizea), mejor latencia percibida.
- Contra: requiere rotación segura de presigned URLs; si se filtra una URL, atacante puede escribir objetos. No encaja con la restricción "resize server-side" de REQ-04.

### Opcion C — Cloudflare Images (transformation nativa)
- Usar el producto gestionado de Cloudflare para resize.
- Pro: zero-config resize, CDN incluido.
- Contra: servicio pago fuera del stack de Workers/D1/R2; rompe el principio de mantener todo dentro del Free Tier.

## Decision

Se elige **Opcion A**. Es la única opción que cumple el requisito
explícito del REQ-04 de hacer resize server-side y no introduce
dependencias pagas. El costo de CPU en el worker es aceptable para
fotos individuales (resize a 256x256 es barato con `wasm-image-resize`),
y el cleanup del objeto anterior es trivial con una sola llamada a
`R2.delete()`.

## Riesgos y mitigaciones

- Riesgo: MIME spoofing (un .exe renombrado a .jpg) → Mitigación: validar magic bytes además del header `Content-Type`; rechazar si no calza.
- Riesgo: la foto anterior queda huérfana si el upload falla a mitad de camino → Mitigación: subir primero la nueva, persistir la nueva key, y SÓLO entonces borrar la anterior (orden importa).
- Riesgo: `wasm-image-resize` no soporta HEIC (formato iPhone default) → Mitigación: rechazar HEIC con 415 + mensaje claro "convierte a JPG o PNG".
- Riesgo: caracteres no-ASCII en el nombre del archivo → Mitigación: derivar la R2 key desde `providerId` y extensión normalizada, ignorar nombre original.

## Metrica de exito

- `POST /api/v1/providers/me/photo` con `image/jpeg` 2 MB → 200 con `{ photo_r2_key: "avatars/42.jpg" }`.
- Subir `application/pdf` → 415.
- Subir 6 MB → 413.
- Subir una segunda foto → el objeto `avatars/42-oldhash.jpg` ya no existe en R2.
- La imagen resultante en R2 es exactamente 256x256 (verificable leyendo metadata con `wrangler r2 object get`).
