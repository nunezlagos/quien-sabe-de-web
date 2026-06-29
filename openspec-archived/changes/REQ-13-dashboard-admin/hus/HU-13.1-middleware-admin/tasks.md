# HU-13.1 — Middleware estricto para rutas admin

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.1-middleware-admin`

## Tareas tecnicas

- [ ] **T1** Helper `requireAdmin(ctx, opts)` en `src/lib/middleware/requireAdmin.ts` con 6 ramas (page/api × no-sesión/forbidden/admin).
- [ ] **T2** Enchufar guard en `src/middleware.ts` con match de prefijos `/dashboard-admin` y `/api/v1/admin/`. Distinguir `kind: 'page' | 'api'` por path.
- [ ] **T3** Si HU-13.7 ya migró `admin_audit_log`: invocar `logAdminAction(env, user.id, 'view', path, null, null, null)` dentro de `requireAdmin`. Si no: try/catch + console.warn (degradación graceful).
- [ ] **T4** Helper `getAuditSampling()` que lee setting `admin_audit_sampling_pct` (default 100, default 0 en dev via wrangler).
- [ ] **T5** Whitelist explícita de rutas auditables: `audit=true` para todo `/api/v1/admin/*` y `/dashboard-admin`. Configurable por setting.
- [ ] **T6** Tests:
  - [ ] `tests/unit/middleware/requireAdmin.test.ts` — 6 casos de la matriz del design.md.
  - [ ] `tests/unit/middleware/auditSampling.test.ts` — sampling 0/50/100.
  - [ ] `tests/integration/middleware/admin-routes.test.ts` — barrido de 8 rutas admin, todas 403 sin admin.
  - [ ] `tests/integration/middleware/admin-audit.test.ts` — admin GET → fila en `admin_audit_log`.
  - [ ] `tests/e2e/admin-guard.spec.ts` — vecino intenta entrar → redirect; admin entra OK.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-guard.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: invertir la condición `user.role !== 'admin'` por `===` → test "vecino → 403" cae en rojo → restaurar
  - [ ] Sabotaje 2: comentar el `ctx.next()` en la rama admin → test E2E "admin entra OK" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar el `if (!user)` y siempre asumir admin → test "sin sesión → 302" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/middleware/requireAdmin.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
