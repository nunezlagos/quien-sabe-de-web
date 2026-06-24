# HU-27.4 — Middleware requireRole acepta multi-rol

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-27-multi-rol-cuenta
**Rama:** `feat/HU-27.4-middleware-multi-rol`

## Tareas técnicas

- [ ] **T1** Refactor `src/lib/middleware/auth.ts`:
  - Cambiar firma de `requireRole(role: string)` a `requireRole(roleOrRoles: Role | Role[], options?: { exactActive?: boolean })`.
  - Normalizar `roleOrRoles` a array.
  - Si `options.exactActive`, comparar `session.active_role` con el array.
  - Else, llamar `hasAnyRole(env, user.id, targets)`.
  - Si falla, retornar `Response` con status 403 y JSON `{error}`.
  - Si pasa, retornar `{user, session}`.
  - Log de debug gateado por `import.meta.env.DEBUG_AUTH`.
- [ ] **T2] Verificar backward-compat: `grep -r "requireRole(" src/pages/api/v1` no requiere cambios.
- [ ] **T3] Documentar nueva firma en `src/lib/middleware/README.md` (si existe) o en comentario JSDoc al inicio de `auth.ts`.
- [ ] **T4] Tests:
  - [ ] `tests/unit/middleware/require-role.test.ts` (con mocks de Astro.locals y env):
    - `requireRole('prestador')` con `user.roles=['vecino','prestador']` → retorna `{user, session}` (acepta).
    - `requireRole('prestador')` con `user.roles=['vecino']` → retorna Response 403.
    - `requireRole(['prestador','admin'])` con `user.roles=['admin']` → acepta.
    - `requireRole('prestador', { exactActive: true })` con `user.roles=['vecino','prestador']` y `active_role='vecino'` → 403.
    - `requireRole('prestador', { exactActive: true })` con `active_role='prestador'` → acepta.
  - [ ] `tests/integration/auth/require-role-multi.test.ts` — fixture user multi-rol: `GET /api/v1/providers/me` con sesión del user → 200; `GET /api/v1/admin/users` → 403. Verificar que `DEBUG_AUTH=1` loguea.
  - [ ] `tests/e2e/multi-role-access.spec.ts` — login multi-rol user con active_role='vecino' → `/dashboard-provider` (que requiere prestador) renderiza OK porque el set incluye prestador; `/dashboard-admin` (que requiere admin) devuelve 403 o redirect a login.
  - [ ] Sabotaje 1: en el middleware, cambiar `hasAnyRole` por check estricto de `active_role` → user multi-rol bloqueado en endpoints prestador → test verifica que con `active_role='vecino'` y `roles=['vecino','prestador']`, `requireRole('prestador')` acepta → restaurar.
  - [ ] Sabotaje 2: olvidar el cast a array (`Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]`) → `requireRole('prestador')` pasa string a `hasAnyRole` que espera array → test verifica que la firma string sigue funcionando → restaurar.
  - [ ] Sabotaje 3: el logging de debug no está gateado por `DEBUG_AUTH` → producción inunda logs → test verifica que sin `DEBUG_AUTH` no se loguea → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/middleware/auth.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `refactor: middleware requireRole acepta multi-rol` y push a rama (no merge a main)