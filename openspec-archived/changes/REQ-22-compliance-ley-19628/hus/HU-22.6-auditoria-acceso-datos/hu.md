# HU-22.6 — Auditoría de acceso admin a datos personales

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** plataforma
**Quiero** dejar trazabilidad de cada acceso admin a datos personales
**Para** cumplir con principios de responsabilidad proactiva

## Criterios de aceptación (Gherkin)

### Escenario: Admin consulta perfil → log
  Dado admin_id=1
  Cuando hace `GET /api/v1/admin/users/42`
  Entonces se inserta fila en `data_access_log` con `(admin_id=1, user_id=42, accessed_at=NOW, action='view_profile')`

### Escenario: Admin requiere motivo para datos sensibles
  Cuando solicita `GET /api/v1/admin/users/42/raw-docs`
  Entonces el endpoint exige header `X-Access-Reason` no vacío
  Y se persiste en la columna `reason`

### Escenario: Vista admin de log
  Cuando admin entra a `/dashboard-admin/audit`
  Entonces ve tabla paginada con últimos accesos (estilo `mockups/dashboard-admin.html`)

### Escenario: User puede pedir su propio log
  Cuando envía `GET /api/v1/users/me/access-log`
  Entonces recibe lista de quién consultó sus datos y cuándo

## Tareas técnicas

- [ ] Tabla `data_access_log (id, admin_id, user_id, action, accessed_at, reason)` con índice `(user_id, accessed_at)`
- [ ] Middleware `auditAdminAccess(action)` en `src/lib/middleware/audit.ts` aplicado a routes `/api/v1/admin/users/**`
- [ ] Endpoint `src/pages/api/v1/users/me/access-log.ts`
- [ ] Vista admin `src/pages/dashboard-admin/audit.astro` reutilizando estilo de tabla del dashboard admin
- [ ] Tests `tests/integration/compliance/access-log.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
