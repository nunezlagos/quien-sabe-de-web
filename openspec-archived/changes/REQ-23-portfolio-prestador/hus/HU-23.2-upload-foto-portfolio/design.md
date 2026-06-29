# Diseño técnico — HU-23.2 — Upload foto portfolio con resize a R2

**REQ padre:** REQ-23-portfolio-prestador

## Modelo de datos

Reusa `portfolio_images` definida en HU-23.1. No agrega columnas.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/portfolio` | POST | sesión prestador (KV `SESSION`) | `multipart/form-data` con campo `file` (image/jpeg, image/png, image/webp; ≤ 5 MB) | `{ id, r2Key, sortOrder, url }` | 400 (multipart inválido), 401 (sin sesión), 403 (sesión no prestador), 409 (`máximo 5 imágenes`), 413 (>5 MB), 415 (MIME no soportado), 500 (fallo R2/D1) |

## Validaciones Zod

```ts
// src/lib/validators/portfolio.ts (pseudocódigo)
export const uploadPortfolioFileMeta // shape: { mimeType: enum['image/jpeg','image/png','image/webp'], byteLength: number().max(5_242_880) }
// El parsing multipart vive en src/lib/utils/multipart.ts (existente para REQ-04).
```

## Componentes UI

Endpoint puro. La UI consumidora pertenece a HU-23.5; aquí sólo se documenta que el contrato debe poder ser invocado desde:

- `mockups/dashboard-provider.html:182-185` — input file que disparará `POST` vía fetch desde `src/lib/client/portfolio.ts` (HU-23.3/23.5).

## Flujo de interacción (secuencial)

1. Prestador selecciona archivo en `<input type="file" accept="image/*">` (`mockups/dashboard-provider.html:184`).
2. Cliente JS construye `FormData`, agrega `file`, envía `POST /api/v1/providers/me/portfolio`.
3. Middleware (`src/middleware.ts`) verifica sesión y rol prestador; rechaza 401/403 si corresponde.
4. Handler parsea multipart, valida MIME y tamaño con Zod (415/413).
5. Servicio `upload.ts` abre transacción D1: `assertPortfolioCapacity` → si 5 lanza 409.
6. Decodifica + redimensiona a 800x800 vía `resizeImage(buffer, 800, 800)` de `src/lib/services/media/resize.ts`.
7. Escribe objeto R2 con key `portfolio/<provider_id>/<uuid>.webp` usando binding `Astro.locals.runtime.env.BUCKET`.
8. Inserta fila en `portfolio_images` con `sortOrder = nextSortOrder()`.
9. Responde 201 con `{ id, r2Key, sortOrder, url }`. Si paso 8 falla, hace `BUCKET.delete(r2Key)` antes de devolver 500.

## Capa de servicios

- `src/lib/services/portfolio/upload.ts`
  - `uploadPortfolioImage(db, bucket, providerId, file): Promise<{ id, r2Key, sortOrder, url }>`
  - Depende de `assertPortfolioCapacity`, `nextSortOrder` (HU-23.1) y `resizeImage` (HU-04.3).
- `src/lib/services/media/resize.ts` — reutilizado, firma `resizeImage(buffer: ArrayBuffer, w: number, h: number): Promise<ArrayBuffer>`.
- `src/lib/utils/r2-keys.ts` — helper `portfolioKey(providerId: number, uuid: string): string`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/portfolio/upload-validators.test.ts` | MIME enum, tamaño máximo, sniff de magic bytes |
| Unit | `tests/unit/media/resize.test.ts` | Resize produce ArrayBuffer con dimensiones esperadas (puede ya existir desde HU-04.3) |
| Integración | `tests/integration/portfolio/upload.test.ts` | 5 uploads OK, 6º → 409, PDF → 415, 10 MB → 413, race condition con dos requests simultáneos |
| E2E | `tests/e2e/dashboard-portfolio.spec.ts` | Cubierto principalmente por HU-23.5; aquí sólo flujo "subir 1 foto" |

## Dependencias y secuencia

- **Bloqueado por:** HU-23.1 (schema), HU-04.x (sesión prestador, helper resize).
- **Bloquea a:** HU-23.3 (delete necesita filas reales), HU-23.5 (dashboard editable).
- **Recursos compartidos:** binding `BUCKET` (R2/MinIO), binding `DB` (D1), binding `SESSION` (KV).

## Riesgos técnicos

- Riesgo: límite de tamaño de body en Worker (~100 MB hard cap, recomendado < 25 MB) → mitigación: cortar en 5 MB en el handler antes de leer todo a memoria.
- Riesgo: WASM resize lento (>50 ms) impacta CPU time del Worker → mitigación: medir con métricas y si rompe SLA mover a Queue + R2 trigger.
- Riesgo: MinIO no soporta exactamente la misma API que R2 → mitigación: usar sólo métodos `put`, `delete`, `get` (subset común); test integración corre contra MinIO local.
