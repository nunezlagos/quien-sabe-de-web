# HU-04.3 — Subida y resize de foto del prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.3-upload-foto-r2`

## Tareas tecnicas

- [ ] **T1** Helper `resizeImageToAvatar(buffer)` en `src/lib/services/media/resize.ts` con pipeline `image-decode` (auto-orientation) → `wasm-image-resize` a 256x256 → `image-encode` JPEG q=85. Devuelve `{ buffer, width, height }`.
- [ ] **T2** Helper `validateImageUpload(buffer, declaredMime)` en `src/lib/services/media/validation.ts`: tamaño ≤ 5 MB, MIME ∈ {jpeg, png, webp}, magic bytes calzan.
- [ ] **T3** Helpers `putMediaObject`, `deleteMediaObject`, `getPublicUrl` en `src/lib/services/storage/r2.ts` usando el binding `Astro.locals.runtime.env.MEDIA`.
- [ ] **T4** Endpoint `src/pages/api/v1/providers/me/photo.ts` (POST). Secuencia: leer body → validar → resizear → subir nueva → UPDATE providers → borrar anterior → devolver 200.
- [ ] **T5** Tests:
  - [ ] `tests/unit/media/resize.test.ts` — buffer 800x600 → output 256x256; verifica dimensiones reportadas.
  - [ ] `tests/unit/media/validation.test.ts` — JPEG/PNG/WebP válidos pasan; PDF rechazado; magic bytes inconsistentes rechazados.
  - [ ] `tests/integration/providers/photo-upload.test.ts` — flujo completo con `@cloudflare/vitest-pool-workers` (D1+R2 reales); JPEG 2 MB 200; PDF 415; 6 MB 413; reemplazo borra key anterior.
  - [ ] `tests/integration/storage/r2.test.ts` — `put` + `delete` + idempotencia de `delete` sobre key inexistente.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar `resizeImageToAvatar` para retornar el buffer sin redimensionar → `tests/unit/media/resize.test.ts` debe caer (width/height != 256) → restaurar.
- [ ] **S2** Invertir el orden del handler (borrar key anterior ANTES de subir nueva) y simular fallo en `R2.put` → verificar que la fila del provider no queda con key inválida y que el bucket no perdió el objeto anterior → restaurar.
- [ ] **S3** Eliminar la validación de magic bytes en `validateImageUpload` → `tests/unit/media/validation.test.ts` (caso JPEG renombrado a PNG) debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/media/*` y `src/lib/services/storage/r2.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
