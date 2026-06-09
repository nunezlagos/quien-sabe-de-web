# HU-03.4 — Cola de verificación en dashboard admin

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** admin
**Quiero** ver el listado de solicitudes pendientes con preview de documentos
**Para** decidir aprobar o rechazar con contexto completo

## Criterios de aceptación (Gherkin)

### Escenario: Listado de pendientes paginado
  Dado 12 solicitudes en estado `pendiente`
  Cuando envío `GET /api/v1/admin/verifications?status=pendiente&limit=10`
  Entonces recibo `{ items: [...10], cursor: "<opaque>" }`
  Y cada item incluye `id, provider, rut_masked, created_at, documents: [...]`

### Escenario: Preview document genera URL firmada GET
  Cuando admin envía `GET /api/v1/admin/verifications/:id/documents/:docId/preview`
  Entonces recibo `{ preview_url, expires_in: 300 }`
  Y la URL es válida sólo 5 minutos

### Escenario: No-admin recibe 403
  Dado un usuario con rol `vecino`
  Cuando envía `GET /api/v1/admin/verifications`
  Entonces recibo status 403

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/verifications/index.ts` con filtros y cursor
- [ ] Endpoint `src/pages/api/v1/admin/verifications/[id]/documents/[docId]/preview.ts`
- [ ] Sección `src/components/admin/VerificationsQueue.astro` dentro de `/dashboard-admin#verifications`
- [ ] Helper `signGetUrl(key, ttl)`
- [ ] Tests `tests/integration/admin/verifications-list.test.ts`, `tests/integration/admin/verifications-preview.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
