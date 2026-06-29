# HU-03.3 — Upload de documentos a R2/MinIO con presigned URL

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** prestador en proceso de verificación
**Quiero** subir mis documentos respaldatorios de forma segura
**Para** que el admin pueda revisarlos sin que yo exponga archivos por email

## Criterios de aceptación (Gherkin)

### Escenario: Solicitar presigned URL
  Dado una verificación en estado `pendiente`
  Cuando envío `POST /api/v1/providers/me/verification/documents` con `{"kind":"cedula", "content_type":"image/jpeg"}`
  Entonces recibo status 200
  Y la respuesta incluye `{ upload_url, r2_key, expires_in: 600 }`
  Y existe fila en `verification_documents` con `uploaded_at = NULL`

### Escenario: Subir archivo a la presigned URL marca uploaded_at
  Dado una presigned URL emitida hace 5 segundos
  Cuando hago PUT del archivo a esa URL
  Entonces R2/MinIO almacena el objeto
  Y un callback `POST /api/v1/providers/me/verification/documents/:id/confirm` actualiza `uploaded_at`

### Escenario: Solicitar presigned URL para verificación inexistente → 404
  Dado un prestador sin verificación abierta
  Cuando solicita presigned URL
  Entonces recibo status 404

### Escenario: Content-type no permitido → 422
  Cuando solicito presigned URL con `content_type: "application/x-msdownload"`
  Entonces recibo status 422 con `{ "error": "content-type no permitido" }`

## Tareas técnicas

- [ ] Tabla `verification_documents` en `src/database/schema.ts`
- [ ] Cliente S3 compatible (apuntando a R2 en prod, MinIO en dev) en `src/lib/services/storage/r2.ts`
- [ ] Helper `signPutUrl(key, contentType, ttl)`
- [ ] Endpoint `src/pages/api/v1/providers/me/verification/documents.ts`
- [ ] Endpoint confirmación `src/pages/api/v1/providers/me/verification/documents/[id]/confirm.ts`
- [ ] Tests `tests/integration/verification/upload.test.ts` contra MinIO local

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
