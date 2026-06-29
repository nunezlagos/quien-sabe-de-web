# HU-27.2 — Endpoint activar rol prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-27-multi-rol-cuenta
**Rama:** `feat/HU-27.2-endpoint-activar-rol-prestador`

## Tareas técnicas

- [ ] **T1** Extender validador `src/lib/validators/auth/roles.ts` con `autoAssignableRoleSchema = z.enum(['vecino', 'prestador'])` y constante `AUTO_ASSIGNABLE_ROLES`.
- [ ] **T2] Servicio `src/lib/services/auth/roles.ts`: extender `addRole` (HU-27.1) con dual-write en transacción: `db.batch([INSERT OR IGNORE INTO user_roles(user_id, role, granted_at, granted_by) VALUES (?, ?, unixepoch(), ?), UPDATE users SET role = ? WHERE id = ?])`. Si `role` ya era el mismo, UPDATE es no-op.
- [ ] **T3] Servicio `src/lib/services/sessions/update.ts` con `updateSessionRoles(env, sessionId, roles)`:
  - Lee sesión actual: `await env.SESSION.get('session:' + sessionId)`.
  - Merge: `{...existing, roles}`.
  - Write back con TTL 30 días.
- [ ] **T4] Endpoint `src/pages/api/v1/users/me/roles/[role].ts` (POST):
  - `requireSession` → 401.
  - `requireVerifiedEmail` (REQ-20) → 403.
  - `autoAssignableRoleSchema.safeParse(params.role)` → 404 si falla; 403 si `role === 'admin'`.
  - Llama `addRole(env, session.userId, role, grantedBy=null)`.
  - Llama `updateSessionRoles(env, session.id, await getUserRoles(env, session.userId))`.
  - Responde 200 con `{roles, active_role: 'vecino'}` (default).
- [ ] **T5] Modificar el botón "Crear Perfil PRO" en `src/pages/dashboard-user.astro` para que apunte al endpoint:
  - Versión form: `<form action="/api/v1/users/me/roles/prestador" method="POST">` con CSRF hidden.
  - Versión JS (preferida): `fetch` + `window.location.assign('/create-trade')` en 200.
- [ ] **T6] Tests:
  - [ ] `tests/unit/validators/auth-roles.test.ts` (extensión) — `autoAssignableRoleSchema` acepta 'vecino', 'prestador'; rechaza 'admin'.
  - [ ] `tests/integration/auth/activate-role.test.ts` — fixture user vecino verificado: POST → 200 + fila en user_roles + users.role actualizado a 'prestador'; segunda POST idempotente (200 sin nueva fila); POST user sin verify → 403; POST `/roles/admin` → 403; sesión KV actualizada con array `['vecino', 'prestador']`.
  - [ ] Sabotaje 1: en el endpoint, olvidar `updateSessionRoles` → sesión KV queda con roles antiguos → test verifica que `requireRole('prestador')` (HU-27.4) acepta al user recién activado (debe pasar) → restaurar.
  - [ ] Sabotaje 2: en el endpoint, olvidar `requireVerifiedEmail` → user sin verify puede activar prestador → test con fixture `emailVerified=false` espera 403 y recibe 200 → restaurar.
  - [ ] Sabotaje 3: en `autoAssignableRoleSchema`, agregar 'admin' a la whitelist por copy-paste → POST `/roles/admin` devuelve 200 → test verifica 403 → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (flujo completo)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/roles.ts` y `src/lib/services/sessions/update.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint activar rol prestador` y push a rama (no merge a main)