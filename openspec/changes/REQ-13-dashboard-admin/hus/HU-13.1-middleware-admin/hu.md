# HU-13.1 — Middleware estricto para rutas admin

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** sistema
**Quiero** bloquear acceso a `/dashboard-admin` y `/api/v1/admin/**` para no-admins
**Para** proteger operaciones sensibles

## Criterios de aceptación (Gherkin)

### Escenario: Acceso vecino a /dashboard-admin → 403
  Dado un usuario rol `vecino` autenticado
  Cuando solicita `/dashboard-admin`
  Entonces recibo status 403

### Escenario: Acceso sin sesión → redirect login
  Dado un request sin sesión
  Cuando solicita `/dashboard-admin`
  Entonces recibo `302 /login?next=/dashboard-admin`

### Escenario: API admin sin admin → 403
  Dado un prestador autenticado
  Cuando solicita `GET /api/v1/admin/users`
  Entonces recibo status 403

### Escenario: Acceso admin OK + auditado
  Dado un admin
  Cuando entra a `/dashboard-admin`
  Entonces accede
  Y se registra en `admin_audit_log` el `path` y `timestamp`

## Tareas técnicas

- [ ] Helper `requireAdmin` en `src/lib/middleware/requireAdmin.ts`
- [ ] Integración en `src/middleware.ts` con prefijos `/dashboard-admin` y `/api/v1/admin/`
- [ ] Auditoría de cada acceso (sample o full según setting)
- [ ] Tests `tests/integration/middleware/requireAdmin.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
