# Diseno tecnico — HU-04.3 — Subida y resize de foto del prestador

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

Esta HU no crea tablas. Consume `providers.photo_r2_key` (definido en
HU-04.1) y el binding R2 `MEDIA` (configurado en `wrangler.toml`).

### Columna relevante (recall)

- `providers.photo_r2_key` — `text` nullable. Se setea con el formato `avatars/<providerId>.<ext>` donde `<ext>` ∈ `jpg|png|webp`.

## Contrato de API

### `POST /api/v1/providers/me/photo`

**Headers**
- `Content-Type: multipart/form-data` con campo `file`.

**Validaciones**
- `Content-Length` ≤ 5 MB → si excede, 413.
- MIME ∈ {`image/jpeg`, `image/png`, `image/webp`} → si no, 415.
- Magic bytes del archivo calzan con el MIME declarado → si no, 415.
- Sesión prestador requerida con perfil existente → si no, 404.

**Response 200**
```json
{ "photo_r2_key": "avatars/42.jpg", "photo_url": "https://media.example.com/avatars/42.jpg" }
```

**Errores**
- 413: `{ "error": "archivo excede 5 MB" }`
- 415: `{ "error": "tipo no permitido" }`
- 404: `{ "error": "perfil no existe" }`

## Validaciones Zod

No aplica (la subida es binaria, no JSON). Las validaciones se hacen
con funciones helper dedicadas:

```ts
// src/lib/services/media/validation.ts
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_BYTES = 5 * 1024 * 1024

export function validateImageUpload(buffer: ArrayBuffer, declaredMime: string): void
```

## Componentes UI

Esta HU es backend. El control de subida se maquetará en HU-12
(dashboard prestador) reutilizando el patrón de
`mockups/dashboard-provider.html:158-186` (gallery con slots vacíos).

## Flujo de interaccion (secuencial)

1. Front hace `POST /api/v1/providers/me/photo` con `multipart/form-data`.
2. Handler lee el body como `ArrayBuffer`.
3. Valida tamaño (`Content-Length`) y MIME declarado + magic bytes.
4. Resizea a 256x256 con `resizeImageToAvatar(buffer)` (helper en `src/lib/services/media/resize.ts` usando `wasm-image-resize`).
5. Deriva nueva key: `avatars/<providerId>.<ext>`.
6. `await R2.put(newKey, resizedBuffer, { httpMetadata: { contentType: declaredMime } })`.
7. Lee la fila actual del provider para capturar `oldPhotoR2Key`.
8. `UPDATE providers SET photo_r2_key = ?, updated_at = unixepoch() WHERE user_id = ?`.
9. Si `oldPhotoR2Key != null && oldPhotoR2Key != newKey` → `await R2.delete(oldPhotoR2Key)`.
10. Devuelve 200 con la nueva key + URL pública.

## Capa de servicios

- `src/lib/services/media/resize.ts`:
  - `resizeImageToAvatar(buffer: ArrayBuffer): Promise<ArrayBuffer>` — usa `wasm-image-resize`, fuerza 256x256, encadena `image-decode` → resize → `image-encode` JPEG q=85.
- `src/lib/services/media/validation.ts`:
  - `validateImageUpload(buffer, mime)` — tamaño + MIME + magic bytes.
- `src/lib/services/storage/r2.ts`:
  - `putMediaObject(key, body, mime): Promise<void>`
  - `deleteMediaObject(key): Promise<void>`
  - `getPublicUrl(key): string` — usa el dominio público configurado en `PUBLIC_MEDIA_URL`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/media/resize.test.ts` | Buffer JPEG 800x800 → buffer de salida tiene dimensiones 256x256 |
| Unit | `tests/unit/media/validation.test.ts` | Magic bytes JPEG/PNG/WebP correctos pasan; PDF rechazado; JPEG mal declarado como PNG rechazado |
| Integracion | `tests/integration/providers/photo-upload.test.ts` | Upload válido 200; PDF 415; 6 MB 413; reemplazo limpia key anterior (verificar `R2.head` 404 en oldKey) |
| Integracion | `tests/integration/storage/r2.test.ts` | `putMediaObject` + `deleteMediaObject` idempotente |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (`providers.photo_r2_key` ya existe en el schema), HU-04.2 (sesión y perfil requerido).
- **Bloquea a:** HU-04.4 (preview renderiza la foto), HU-07 (perfil público).
- **Recursos compartidos:** binding R2 `MEDIA` en `wrangler.toml`, `Astro.locals.runtime.env.MEDIA`.

## Riesgos tecnicos

- Riesgo: resize falla silenciosamente y la imagen persiste sin transformación → Mitigación: helper devuelve metadata `{ width, height }`; el handler verifica `width === 256 && height === 256` antes de hacer `put`.
- Riesgo: orden incorrecto (borrar antes de subir nuevo) deja al prestador sin foto tras un fallo transitorio → Mitigación: documentar explícitamente el orden "subir nuevo → actualizar DB → borrar viejo".
- Riesgo: `wasm-image-resize` no soporta EXIF rotation (foto de celular rotada) → Mitigación: usar `image-decode` que aplica auto-orientation por EXIF antes del resize; documentado en T1.
