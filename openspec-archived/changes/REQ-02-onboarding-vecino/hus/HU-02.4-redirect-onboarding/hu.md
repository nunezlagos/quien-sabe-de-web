# HU-02.4 — Middleware redirige a /onboarding si incompleto

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-02-onboarding-vecino

## Historia de usuario

**Como** vecino que se acaba de registrar
**Quiero** ser redirigido automáticamente a `/onboarding` cuando intento acceder a rutas privadas
**Para** no quedarme atascado en una página rota sin perfil

## Criterios de aceptación (Gherkin)

### Escenario: Acceso a /dashboard-user sin onboarding redirige
  Dado un vecino con `onboarded_at = NULL`
  Cuando navega a `/dashboard-user`
  Entonces recibo status 302 hacia `/onboarding`

### Escenario: Acceso a /onboarding estando onboardeado redirige al dashboard
  Dado un vecino con `onboarded_at` no nulo
  Cuando navega a `/onboarding`
  Entonces recibo status 302 hacia `/dashboard-user`

### Escenario: Prestador sin onboarding vecino-only no es forzado
  Dado un usuario con `role="prestador"` y `onboarded_at = NULL`
  Cuando navega a `/dashboard-provider`
  Entonces el flujo de onboarding de vecino NO se aplica
  Y el middleware sigue su lógica de prestador (verificación)

### Escenario: Visitante anónimo no se ve afectado
  Dado un request sin sesión
  Cuando navega a `/`
  Entonces NO se redirige a `/onboarding`

## Tareas técnicas

- [ ] Lógica en `src/middleware.ts` que evalúa `locals.user?.onboarded_at` y rol
- [ ] Helper `requireOnboarded` en `src/lib/middleware/requireOnboarded.ts`
- [ ] Lista de rutas privadas en `src/lib/middleware/protectedRoutes.ts`
- [ ] Tests `tests/unit/middleware/requireOnboarded.test.ts`, `tests/integration/middleware/redirect-onboarding.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
