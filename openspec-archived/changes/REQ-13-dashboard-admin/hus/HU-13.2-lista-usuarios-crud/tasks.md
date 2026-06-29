# HU-13.2 — Listado de usuarios con ban y cambio de rol

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.2-lista-usuarios-crud`

## Tareas tecnicas

- [ ] **T1** Schemas Zod `userRoleSchema`, `userStatusSchema`, `adminUsersListQuerySchema`, `adminUserPatchSchema` en `src/lib/validators/admin-users.ts`.
- [ ] **T2** Helper `isSelfBan(actorId, targetId, patch)` que retorna `true` si la mutación dejaría al actor inactivo o sin permisos admin.
- [ ] **T3** Servicio `listAdminUsers(env, filters)` en `src/lib/services/admin/users.ts`.
- [ ] **T4** Servicio `invalidateUserSessions(env, userId)` que itera `sessions:by_user:<id>` en KV y borra cada `session:<sid>`.
- [ ] **T5** Servicio `patchAdminUser(env, actorId, targetId, patch)` con validación self-ban + invalidación condicional + audit log.
- [ ] **T6** Endpoint `GET /api/v1/admin/users` en `src/pages/api/v1/admin/users/index.ts` con guard HU-13.1 y `adminUsersListQuerySchema`.
- [ ] **T7** Endpoint `PATCH /api/v1/admin/users/[id]` en `src/pages/api/v1/admin/users/[id].ts` con guard + `adminUserPatchSchema` + self-ban 409.
- [ ] **T8** Componente `UsersList.astro` con tabla + filtros arriba (reuso del patrón de `mockups/dashboard-admin.html:147-186`).
- [ ] **T9** Componente `UserActions.astro` por fila con botones condicionales (Banear si active, Desbanear si banned, Editar siempre).
- [ ] **T10** Componente `UserEditModal.astro` con selects rol/estado + confirmación inline antes de submit.
- [ ] **T11** Cablear `UsersList` en la sección `users-section` de `dashboard-admin.astro`.
- [ ] **T12** Tests:
  - [ ] `tests/unit/admin-users/patch-schema.test.ts` — body vacío rechaza; role inválido rechaza.
  - [ ] `tests/unit/admin-users/self-ban.test.ts` — self-ban rol no-admin y status banned retornan true.
  - [ ] `tests/integration/admin/users-list.test.ts` — 3 filtros + paginación 50 users limit 20.
  - [ ] `tests/integration/admin/users-patch.test.ts` — ban OK + sesiones KV borradas + audit row; self-ban 409; non-admin 403.
  - [ ] `tests/e2e/admin-users-crud.spec.ts` — admin banea → tabla refleja cambio; usuario baneado intenta login → bloqueado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-users-crud.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar la llamada a `invalidateUserSessions` → test "sesiones KV borradas" cae en rojo → restaurar
  - [ ] Sabotaje 2: invertir la condición `actorId !== targetId` en el self-ban guard → test "self-ban 409" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar el `WHERE role = ?` del listado → test "filtro role=prestador" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/users.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
