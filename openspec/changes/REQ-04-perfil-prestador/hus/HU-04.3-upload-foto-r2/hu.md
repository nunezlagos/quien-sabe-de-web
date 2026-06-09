# HU-04.3 — Subida y resize de foto del prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** prestador con perfil
**Quiero** subir mi foto de avatar
**Para** que mi perfil sea más confiable y reconocible

## Criterios de aceptación (Gherkin)

### Escenario: Subida válida genera avatar 256x256
  Dado un prestador con perfil
  Cuando envío `POST /api/v1/providers/me/photo` con un archivo `image/jpeg` de 2 MB
  Entonces recibo status 200 con `{ photo_r2_key }`
  Y existe el objeto en R2/MinIO bucket `media` con dimensiones 256x256
  Y la fila `providers` tiene `photo_r2_key` actualizado

### Escenario: Tipo MIME no permitido → 415
  Cuando envío un archivo `application/pdf`
  Entonces recibo status 415 con `{ "error": "tipo no permitido" }`

### Escenario: Archivo > 5 MB → 413
  Cuando envío un archivo de 6 MB
  Entonces recibo status 413

### Escenario: Reemplazo limpia foto anterior
  Dado un prestador con `photo_r2_key="old.jpg"`
  Cuando sube una nueva foto
  Entonces el objeto `old.jpg` ya no existe en R2

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/photo.ts`
- [ ] Helper `resizeImageToAvatar(buffer)` con `wasm-image-resize` o equivalente en `src/lib/services/media/resize.ts`
- [ ] Cleanup de objeto previo en `src/lib/services/storage/r2.ts`
- [ ] Tests `tests/integration/providers/photo-upload.test.ts` con fixtures jpeg/png/pdf

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
