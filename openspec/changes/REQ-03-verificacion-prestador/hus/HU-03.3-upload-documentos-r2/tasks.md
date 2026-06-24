# HU-03.3 — Upload de documentos a R2/MinIO con presigned URL

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.3-upload-documentos-r2`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `verificationDocuments` a `src/database/schema.ts` con columnas + UNIQUE sobre `r2Key` + índices.
- [ ] **T2** Migración `src/database/migrations/0007_verification_documents.sql` con `CHECK` sobre `kind` y `content_type`, FK con ON DELETE CASCADE.
- [ ] **T3** Cliente S3-compatible `src/lib/services/storage/r2.ts` con `getS3Client(env)`, `signPutUrl(env, key, contentType, ttl)`, `signGetUrl(env, key, ttl)`, `headObject(env, key)`. Usa `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- [ ] **T4** Servicio `src/lib/services/verification/documents.ts` con `requestPresignedUpload` y `confirmUpload`.
- [ ] **T5** Zod schema `RequestPresignedDoc` en `src/lib/validators/verification.ts` (extender archivo).
- [ ] **T6** Endpoint `src/pages/api/v1/providers/me/verification/documents.ts` (POST → presigned URL).
- [ ] **T7** Endpoint `src/pages/api/v1/providers/me/verification/documents/[id]/confirm.ts` (POST → confirma, llama `headObject`).
- [ ] **T8** Variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` en `wrangler.toml.example`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/storage/r2.test.ts` — `signPutUrl` retorna URL con query string `X-Amz-Signature`, `X-Amz-Expires=600`, host=`R2_ENDPOINT`; `headObject` mock retorna true/false según fixture.
  - [ ] `tests/integration/verification/upload.test.ts` — POST `/documents` con kind/content-type válido y verificación pendiente → 200 con upload_url + fila en `verification_documents` con `uploaded_at=NULL`; PUT a upload_url sube a MinIO local; POST `/confirm` con `headObject` true → uploaded_at poblado; POST `/documents` sin verificación pendiente → 404; POST con `content_type: 'application/x-msdownload'` → 422.

## Sabotaje obligatorio

- [ ] **Sabotaje 1`: omitir el check de `content_type` en la whitelist dentro de `RequestPresignedDoc.parse` → test "Content-type no permitido → 422" debe detectar que se acepta `application/x-msdownload` → restaurar.
- [ ] **Sabotaje 2`: en `confirmUpload`, NO llamar `headObject` antes de marcar `uploaded_at` (asume que siempre está) → test "PUT a upload_url falla (objeto no existe) → /confirm debe rechazar" debe detectar que uploaded_at se setea sin que el objeto exista → restaurar (necesita agregar este escenario al test si no existe).
- [ ] **Sabotaje 3`: cambiar el TTL del presigned URL de 600 a 86400 (24h) → test unit que verifica `expires_in: 600` en la respuesta debe detectar el valor incorrecto → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración contra MinIO local)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/storage/r2.ts` y `src/lib/services/verification/documents.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.3-upload-documentos-r2` (no merge a main sin review)
