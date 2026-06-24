# HU-23.2 — Upload foto portfolio con resize a R2

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-23-portfolio-prestador
**Rama:** `feat/HU-23.2-upload-foto-portfolio`

## Tareas técnicas

- [ ] **T1** Helper `src/lib/utils/multipart.ts` con `parseMultipart(request, maxBytes)`. Reusar/crear para REQ-04 si aún no existe.
- [ ] **T2** Helper `src/lib/utils/r2-keys.ts` exportando `portfolioKey(providerId, uuid): string` con formato `portfolio/<provider_id>/<uuid>.webp`.
- [ ] **T3** Helper `src/lib/utils/uuid.ts` con `uuidV4(): string` (crypto.randomUUID disponible en Workers).
- [ ] **T4** Servicio `src/lib/services/portfolio/upload.ts` con `uploadPortfolioImage(db, bucket, providerId, file)`:
  - `assertPortfolioCapacity` → 409 si lleno.
  - Decodifica + `resizeImage(buffer, 800, 800)` (helper de HU-04.3, sino crearlo con `@cf-wasm/photon` o similar).
  - `bucket.put(portfolioKey, resizedBuffer, { httpMetadata: { contentType: 'image/webp' } })`.
  - INSERT fila con `sortOrder = nextSortOrder()`.
  - Si INSERT falla → `bucket.delete(key)` antes de devolver 500.
- [ ] **T5** Validador `uploadPortfolioFileMeta` en `src/lib/validators/portfolio.ts` (MIME enum `image/jpeg|png|webp`, byteLength max 5*1024*1024). Sniff magic bytes (no confiar en header).
- [ ] **T6] Endpoint `src/pages/api/v1/providers/me/portfolio.ts` (POST, sesión prestador):
  - `requireSession` + verificación rol prestador → 401/403.
  - Parsea multipart → 400 si falla.
  - Valida MIME y tamaño → 415/413.
  - Llama `uploadPortfolioImage` → 201 con `{id, r2Key, sortOrder, url}`.
- [ ] **T7** Configurar binding `BUCKET` en `wrangler.toml.example` apuntando a MinIO local en dev (`http://minio:9000/quien-sabe-files` con credenciales).
- [ ] **T8** Tests:
  - [ ] `tests/unit/portfolio/upload-validators.test.ts` — MIME enum, tamaño máximo, sniff de magic bytes.
  - [ ] `tests/unit/media/resize.test.ts` — resize produce ArrayBuffer con dimensiones 800x800.
  - [ ] `tests/integration/portfolio/upload.test.ts` — 5 uploads OK, 6º → 409, PDF → 415, 10 MB → 413, race condition con dos requests simultáneos.
  - [ ] `tests/e2e/dashboard-portfolio.spec.ts` — flujo "subir 1 foto" (caso mínimo; cobertura completa en HU-23.5).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `uploadPortfolioImage`, omitir el rollback `bucket.delete(key)` al fallar INSERT → objetos huérfanos en R2, test integración rojo → restaurar
- [ ] Sabotaje 2: no llamar `assertPortfolioCapacity` antes de subir → 6ª imagen aceptada, test integración rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/portfolio/upload.ts`
- [ ] Type check verde
- [ ] Commit `feat: upload foto portfolio con resize R2` y push