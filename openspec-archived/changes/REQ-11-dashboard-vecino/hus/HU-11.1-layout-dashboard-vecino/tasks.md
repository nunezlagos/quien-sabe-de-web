# HU-11.1 — Layout del dashboard del vecino

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-11-dashboard-vecino
**Rama:** `feat/HU-11.1-layout-dashboard-vecino`

## Tareas tecnicas

- [ ] **T1** Definir `App.Locals` en `src/env.d.ts` con shape `{ user: { id, email, role, photoUrl? } | null, sessionId: string | null }`.
- [ ] **T2** Helper `resolveDefaultTab` en `src/lib/services/dashboard/resolveDefaultTab.ts` que parsea `?tab=` con `dashboardTabSchema` y cae a `contacts`.
- [ ] **T3** Helper `resolvePostLoginRedirect` en `src/lib/middleware/postLoginRedirect.ts` con firma `(session, requestedNext) => string` y whitelist de `next` permitido (sólo paths `/dashboard-user`).
- [ ] **T4** Componente `src/components/dashboard/user/Header.astro` (foto + email + rol + botón "Cerrar sesión").
- [ ] **T5** Componente `src/components/dashboard/user/Tabs.astro` con tres links y prop `active: 'contacts' | 'reviews' | 'profile'`.
- [ ] **T6** Componente `src/components/dashboard/user/Layout.astro` que compone Header + Tabs + slot por tab.
- [ ] **T7** Vista `src/pages/dashboard-user.astro` con `Astro.locals.user`, parseo de `?tab=`, render del Layout, y slots vacíos por tab (los contenidos llegan en HU-11.2/11.3/11.4).
- [ ] **T8** Middleware global `src/middleware.ts`: si ruta es `/dashboard-user*` y `user` null → 302 a `/login?next=<original>`; si ruta es `/dashboard-admin*` y role !== admin → 403 (esto último se delega a HU-13.1, pero dejamos el gancho aquí).
- [ ] **T9** Header `Cache-Control: private, no-store` en respuesta de `/dashboard-user`.
- [ ] **T10** Tests:
  - [ ] `tests/unit/dashboard/postLoginRedirect.test.ts` — admin pidiendo `next=/dashboard-admin` se mantiene; vecino pidiendo `next=/dashboard-admin` se sobrescribe a `/dashboard-user`.
  - [ ] `tests/unit/dashboard/resolveDefaultTab.test.ts` — valores válidos, valor inválido, valor ausente.
  - [ ] `tests/integration/middleware/dashboard-guard.test.ts` — sin sesión → 302 a login; vecino → 200; admin → 302 a `/dashboard-admin`.
  - [ ] `tests/e2e/dashboard-user-layout.spec.ts` — tres escenarios Gherkin del `hu.md`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/dashboard-user-layout.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar la línea `if (!user) return redirect('/login?next=...')` en middleware → test "Sin sesión → 302" cae en rojo → restaurar
  - [ ] Sabotaje 2: cambiar default de `resolveDefaultTab` a `'profile'` → test E2E "tab default activa" cae en rojo → restaurar
  - [ ] Sabotaje 3: borrar el `<Header />` del Layout → test E2E "header con email" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/dashboard/` y `src/lib/middleware/postLoginRedirect.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
