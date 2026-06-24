# HU-03.4 — Cola de verificación en dashboard admin

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.4-cola-admin-verificacion`

## Tareas tecnicas

- [ ] **T1** Migración adicional `src/database/migrations/0008_verifications_admin_index.sql` con `CREATE INDEX idx_provider_verifications_status_created ON provider_verifications(status, created_at DESC, id DESC);`.
- [ ] **T2** Zod schemas `ListVerificationsQuery`, `CursorPayloadSchema` + helpers `encodeCursor`/`decodeCursor` en `src/lib/validators/admin.ts`.
- [ ] **T3** Servicio `src/lib/services/admin/verifications.ts` con `listVerifications(db, query)` y `getDocumentPreviewUrl(env, db, verificationId, documentId)`.
- [ ] **T4** Endpoint `src/pages/api/v1/admin/verifications/index.ts` con `GET`.
- [ ] **T5** Endpoint `src/pages/api/v1/admin/verifications/[id]/documents/[docId]/preview.ts` con `GET`.
- [ ] **T6** Helper de guard `requireAdmin(locals)` en `src/lib/middleware/requireAdmin.ts` (reusado por REQ-13 y futuras rutas admin). Lanza `Response` con 403 si `locals.user.role !== 'admin'`.
- [ ] **T7** Sección `src/components/admin/VerificationsQueue.astro` que se monta en `/dashboard-admin#verifications` (consumida por REQ-13).
- [ ] **T8** Tests:
  - [ ] `tests/unit/admin/cursor.test.ts` — `encodeCursor`/`decodeCursor` roundtrip; `decodeCursor('invalid')` lanza ZodError; payload incompleto rechazado.
  - [ ] `tests/integration/admin/verifications-list.test.ts` — 12 pendientes + limit=10 → 10 items + cursor no-null; segunda página con ese cursor → 2 items + cursor=null; filtro `status=verificado` retorna vacío; usuario vecino → 403; RUT_masked presente, `rut` ausente en response.
  - [ ] `tests/integration/admin/verifications-preview.test.ts` — 200 con `preview_url` conteniendo `X-Amz-Signature`; `expires_in: 300`; 404 si document no pertenece a verification; 403 sin admin.

## Sabotaje obligatorio

- [ ] **Sabotaje 1`: en `listVerifications`, omitir la validación de admin y exponer los datos a cualquier usuario autenticado → test "No-admin recibe 403" debe detectar acceso de vecino → restaurar.
- [ ] **Sabotaje 2`: cambiar el TTL de `signGetUrl` de 300 a 3600 (1h) → test que verifica `expires_in: 300` debe detectar el valor incorrecto → restaurar.
- [ ] **Sabotaje 3`: en `getDocumentPreviewUrl`, NO verificar que el document pertenece a la verification (acepta cualquier docId) → test "404 si document no pertenece a verification" debe detectar acceso cruzado → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/admin/verifications.ts` y `src/lib/middleware/requireAdmin.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.4-cola-admin-verificacion` (no merge a main sin review)
