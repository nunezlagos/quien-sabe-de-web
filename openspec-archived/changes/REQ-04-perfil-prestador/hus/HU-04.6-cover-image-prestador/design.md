# Diseno tecnico — HU-04.6 — Cover image (hero) del prestador en R2

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

### Cambio de schema

`providers.cover_r2_key` ya existe en el schema definido por HU-04.1
(text nullable). Si por orden de merge la columna aún no está presente
en ambientes donde HU-04.1 ya aplicó, agregar migración:

```sql
-- 0003_provider_cover.sql
ALTER TABLE providers ADD COLUMN cover_r2_key TEXT;
```

No requiere índice (no se filtra por cover en queries).

## Contrato de API

### `POST /api/v1/providers/me/cover`

**Headers**
- `Content-Type: multipart/form-data` con campo `file`.

**Validaciones**
- `Content-Length` ≤ 8 MB → si excede, 413.
- MIME ∈ {`image/jpeg`, `image/png`, `image/webp`} → si no, 415.
- Magic bytes calzan → si no, 415.
- Sesión prestador con perfil existente → si no, 404.

**Response 200**
```json
{ "cover_r2_key": "covers/42.jpg", "cover_url": "https://media.example.com/covers/42.jpg" }
```

### Cambio en `GET /p/[slug]`

Si `provider.cover_r2_key != null`, el hero usa `background-image: url(cover_url)` con clases `bg-cover bg-center`. Si null, fallback `bg-gradient-to-r from-primary to-primary-dark` con `text-white py-16`.

## Validaciones Zod

No aplica (binario). Reuso `validateImageUpload` de HU-04.3 pero con límite 8 MB.

```ts
// src/lib/services/media/validation.ts (extiende HU-04.3)
export const MAX_COVER_BYTES = 8 * 1024 * 1024
export function validateCoverUpload(buffer: ArrayBuffer, declaredMime: string): void
```

## Componentes UI

- `src/components/profile/Hero.astro` — bloque hero reutilizable:
  - Props: `coverUrl: string | null`, `title: string` (nombre del prestador), `subtitle: string` (oficio + badge verificado).
  - Si `coverUrl`: `<header style="background-image: url(...)" class="bg-cover bg-center py-16 text-white relative">`.
  - Si null: `<header class="bg-gradient-to-r from-primary to-primary-dark py-16 text-white">`.
  - Overlay `bg-black/20` para legibilidad del texto.

## Flujo de interaccion (secuencial)

1. Front hace `POST /api/v1/providers/me/cover` con `multipart/form-data`.
2. Handler lee body, valida (8 MB, MIME, magic bytes).
3. `resizeImage(buffer, 1200, 400, { quality: 80 })` (helper parametrizable en `src/lib/services/media/resize.ts`).
4. Deriva key: `covers/<providerId>.<ext>`.
5. `R2.put(newKey, resizedBuffer, ...)`.
6. Lee `oldCoverR2Key`, `UPDATE providers SET cover_r2_key = ?, updated_at = unixepoch() WHERE user_id = ?`.
7. Si `oldCoverR2Key != null && oldCoverR2Key != newKey` → `R2.delete(oldCoverR2Key)`.
8. Devuelve 200 con key + URL pública.
9. Próximo `GET /p/<slug>` renderiza el nuevo cover (o gradient si es null).

## Capa de servicios

- `src/lib/services/media/resize.ts` (extiende HU-04.3):
  - `resizeImage(buffer, width, height, opts?): Promise<{ buffer, width, height }>` — parametrizable; usado por HU-04.3 con `256x256` y por esta HU con `1200x400`.
- `src/lib/services/storage/r2.ts` (reuso): `putMediaObject`, `deleteMediaObject`, `getPublicUrl`.
- `src/lib/services/providers.ts` (extiende HU-04.2):
  - `updateCover(db, userId, coverR2Key): Promise<{ oldKey: string | null }>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/media/resize.test.ts` (extiende) | `resizeImage(buf, 1200, 400)` → output exactamente 1200x400 |
| Unit | `tests/unit/media/validation.test.ts` (extiende) | `validateCoverUpload` con 9 MB → throw; PDF → throw |
| Integracion | `tests/integration/providers/cover-upload.test.ts` | Upload válido 200; PDF 415; 9 MB 413; reemplazo borra key anterior |
| Integracion | `tests/integration/providers/render.test.ts` | `GET /p/<slug>` con cover → response contiene URL; sin cover → contiene clase gradient |
| E2E | `tests/e2e/profile-cover-render.spec.ts` | Subir cover via dashboard → ver hero con imagen en `/p/<slug>` |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (columna `cover_r2_key` en schema), HU-04.2 (sesión y perfil), HU-04.3 (helpers de media y storage reutilizables).
- **Bloquea a:** HU-07 (perfil público) — el componente `Hero.astro` se monta en `/p/[slug].astro`.
- **Recursos compartidos:** `src/lib/services/media/resize.ts`, `src/lib/services/storage/r2.ts`, binding R2 `MEDIA`.

## Riesgos tecnicos

- Riesgo: orden de operaciones roto (borrar antes de subir nuevo) deja al prestador sin cover tras un fallo → Mitigación: misma regla que HU-04.3 — subir nuevo → UPDATE → borrar viejo.
- Riesgo: image-encode JPEG q=80 produce artefactos visibles en imágenes con gradientes → Mitigación: aceptar la pérdida (calidad/peso es mejor que LCP malo); test visual manual en QA.
- Riesgo: si HU-04.1 merge antes sin la columna `cover_r2_key`, la migración `0003_provider_cover.sql` debe ser backwards-compatible (sólo `ADD COLUMN` sin default) → Mitigación: documentado en T1.
