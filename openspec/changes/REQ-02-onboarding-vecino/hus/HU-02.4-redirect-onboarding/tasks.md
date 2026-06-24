# HU-02.4 — Middleware redirige a /onboarding si incompleto

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-02-onboarding-vecino
**Rama:** `feat/HU-02.4-redirect-onboarding`

## Tareas tecnicas

- [ ] **T1** Extender `App.Locals.user` en `src/env.d.ts` con `onboardedAt: number | null`.
- [ ] **T2** Extender middleware de HU-01.2 (`src/middleware.ts`) para incluir `onboardedAt` al enriquecer `locals.user` desde `users`.
- [ ] **T3** Constante `PROTECTED_ROUTES_VECINO` en `src/lib/middleware/protectedRoutes.ts` con `/dashboard-user`, `/favorites`, `/resenas/nueva`, `/cuenta`.
- [ ] **T4** Helper `requireOnboardedVecino(locals, url)` en `src/lib/middleware/requireOnboarded.ts` que aplica la lógica descrita en design.md.
- [ ] **T5** Llamar `requireOnboardedVecino` desde `src/middleware.ts` después de hidratar `locals.user`. Si retorna `Response`, devolverla; si retorna `null`, continuar.
- [ ] **T6** Tests:
  - [ ] `tests/unit/middleware/requireOnboarded.test.ts` — 5 casos:
    1. Vecino sin `onboardedAt` + ruta `/dashboard-user` → `Response.redirect('/onboarding', 302)`.
    2. Vecino con `onboardedAt` + `/onboarding` → `Response.redirect('/dashboard-user', 302)`.
    3. Vecino con `onboardedAt` + ruta protegida → `null`.
    4. Prestador sin `onboardedAt` + `/dashboard-provider` → `null` (no aplica a vecino).
    5. Visitante anónimo (`locals.user === undefined`) + `/dashboard-user` → `null` (lo maneja auth de HU-01.2).
  - [ ] `tests/integration/middleware/redirect-onboarding.test.ts` — request HTTP simulado con cookie de vecino sin `onboardedAt` a `/dashboard-user` → 302 Location `/onboarding`; idem al revés.

## Sabotaje obligatorio

- [ ] **Sabotaje 1`: en `requireOnboardedVecino`, omitir el check de `locals.user.role !== 'vecino'` → test "Prestador sin onboarding vecino-only no es forzado" debe detectar que el prestador recibe redirect a `/onboarding` → restaurar.
- [ ] **Sabotaje 2**: eliminar la rama explícita para `url.pathname === '/onboarding'` (queda solo la de protectedRoutes) → test "Acceso a /onboarding estando onboardeado redirige al dashboard" debe detectar que no redirige → restaurar.
- [ ] **Sabotaje 3`: cambiar `redirect('/onboarding', 302)` por `redirect('/onboarding', 301)` (permanente) → test que verifica status 302 debe detectar 301 → restaurar (302 es semantically correcto para redirect basado en estado de sesión, no permanente).

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/middleware/requireOnboarded.ts` y `src/middleware.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-02.4-redirect-onboarding` (no merge a main sin review)
