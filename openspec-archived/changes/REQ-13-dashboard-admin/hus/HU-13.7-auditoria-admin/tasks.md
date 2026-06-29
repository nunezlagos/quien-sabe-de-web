# HU-13.7 — Log de auditoría de acciones admin

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.7-auditoria-admin`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_admin_audit_log.sql`: CREATE TABLE + 3 índices.
- [ ] **T2** Actualizar `src/database/schema.ts#adminAuditLog`.
- [ ] **T3** Helper `logAdminAction(env, ctx, action, entity, entityId, before, after)` en `src/lib/services/audit/admin.ts`.
- [ ] **T4** Servicio `listAuditLog(env, filters)` en `src/lib/services/audit/admin.ts` con WHERE dinámico + cursor.
- [ ] **T5** Schema Zod `auditLogQuerySchema` en `src/lib/validators/admin-audit-log.ts`.
- [ ] **T6** Endpoint `src/pages/api/v1/admin/audit-log.ts` (`GET`) con guard HU-13.1.
- [ ] **T7** Helper `formatJSONPreview(value, maxBytes=2048)` que trunca y prettifica.
- [ ] **T8** Componente `AuditLogRow.astro` con `<details>` expandible mostrando diff.
- [ ] **T9** Componente `AuditLogPanel.astro` con tabla + filtros arriba.
- [ ] **T10** Integrar `logAdminAction` en HU-13.1 (si aún no se hizo), HU-13.2, HU-13.3, HU-13.6.
- [ ] **T11** Cablear `AuditLogPanel` en una nueva sección `audit-section` de `dashboard-admin.astro`.
- [ ] **T12** Tests:
  - [ ] `tests/unit/admin-audit/logAdminAction.test.ts` — snapshot serialize; entityId string vs number.
  - [ ] `tests/unit/admin-audit/list-query-schema.test.ts` — from > to rechaza; filtros opcionales.
  - [ ] `tests/integration/admin/audit-log-insert.test.ts` — INSERT por 5 actions; FK a users válido.
  - [ ] `tests/integration/admin/audit-log-list.test.ts` — filtros combinados; paginación con 100 filas limit 20.
  - [ ] `tests/integration/admin/audit-log-rbac.test.ts` — vecino 403; sin sesión 401.
  - [ ] `tests/integration/admin/audit-log-fk.test.ts` — DELETE user con log falla por RESTRICT.
  - [ ] `tests/e2e/admin-audit-log.spec.ts` — admin ejecuta 3 acciones → log muestra 3 filas con before/after.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-audit-log.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `await env.DB.insert(adminAuditLog).values(...)` → test E2E "3 acciones → 3 filas" cae en rojo → restaurar
  - [ ] Sabotaje 2: invertir el `ORDER BY created_at DESC` por ASC → test "últimas 50 ordenadas desc" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar el `WHERE actor_id = ?` condicional → test "filtro actor_id" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/audit/admin.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
