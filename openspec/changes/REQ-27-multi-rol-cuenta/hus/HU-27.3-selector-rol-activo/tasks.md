# HU-27.3 — Selector de rol activo en navbar

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-27-multi-rol-cuenta
**Rama:** `feat/HU-27.3-selector-rol-activo`

## Tareas técnicas

- [ ] **T1** Validador `activeRoleSchema` en `src/lib/validators/auth/active-role.ts` con Zod enum.
- [ ] **T2` Constantes en `src/lib/services/auth/role-redirects.ts`: `ROLE_LABELS = {vecino: 'Vecino', prestador: 'Prestador', admin: 'Admin'}` y `ROLE_REDIRECTS = {vecino: '/dashboard-user', prestador: '/dashboard-provider', admin: '/dashboard-admin'}`.
- [ ] **T3] Servicio `src/lib/services/sessions/active-role.ts` con `setActiveRole(env, sessionId, role)` que hace `env.SESSION.put('session:' + sessionId, JSON.stringify({..., active_role: role}))`.
- [ ] **T4] Endpoint `src/pages/api/v1/users/me/active-role.ts` (POST, sesión):
  - `requireSession` → 401.
  - Parse con `activeRoleSchema` → 400.
  - `if (!await hasRole(env, session.userId, role))` → 403.
  - Set cookie `qs_active_role=<role>.<hmac>` con `signCookie` (HU-22.1).
  - `setActiveRole(env, session.id, role)`.
  - Responde 200 con `{active_role, redirect: ROLE_REDIRECTS[role]}`.
- [ ] **T5] Componente `src/components/navbar/RoleSwitcher.astro` con props `{ roles, activeRole }`. Render condicional: `roles.length <= 1` → null. Dropdown markup con botones por rol.
- [ ] **T6] Script inline en el componente: toggle dropdown visibility; cada botón hace `fetch POST /api/v1/users/me/active-role` + `window.location.assign(data.redirect)`.
- [ ] **T7] Insertar `<RoleSwitcher roles={session.roles} activeRole={session.active_role} />` en `src/layouts/Layout.astro` navbar, después del logo y antes de los slots de acciones.
- [ ] **T8] Si `env.CONSENT_SECRET` no está configurado (modo dev), usar fallback `'dev-secret-only-for-tests'`. Documentar.
- [ ] **T9] Tests:
  - [ ] `tests/unit/validators/active-role.test.ts` — schema acepta los 3 roles; rechaza `''`, `null`, `123`.
  - [ ] `tests/integration/auth/role-switcher.test.ts` — user `roles=['vecino','prestador']` GET página → HTML contiene `<div id="role-switcher">` con 2 botones; user `roles=['vecino']` → HTML NO contiene switcher. POST `/active-role {role:'prestador'}` → 200 + cookie `qs_active_role` con firma válida + sesión con `active_role='prestador'`; POST con rol no en set → 403; POST con rol inválido → 400.
  - [ ] `tests/e2e/role-switcher.spec.ts` — login multi-rol → ver dropdown → click "Prestador" → URL = `/dashboard-provider` + cookie presente; alterar cookie a valor random → reload → cae a fallback primer rol.
  - [ ] Sabotaje 1: en el endpoint, no firmar la cookie (`document.cookie = 'qs_active_role=' + role` sin HMAC) → user edita cookie a `admin` → middleware acepta → test verifica que el SSR del dashboard-admin rechaza al user sin rol admin real → restaurar.
  - [ ] Sabotaje 2: en el componente, siempre renderizar el dropdown (sin chequear `roles.length > 1`) → user con rol único ve un dropdown inútil → test verifica que user con 1 rol no ve el switcher → restaurar.
  - [ ] Sabotaje 3: en el endpoint, olvidar `setActiveRole` en sesión KV → cookie cambia pero sesión queda con active_role viejo → test verifica que la sesión tiene el nuevo active_role tras POST → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/sessions/active-role.ts` y `src/components/navbar/RoleSwitcher.astro`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: selector rol activo en navbar` y push a rama (no merge a main)