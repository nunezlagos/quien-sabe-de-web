# HU-21.4 — Redirect post-wizard a /verification

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** prestador que terminó el wizard
**Quiero** ir directo al flujo de verificación
**Para** completar mi proceso sin pasos intermedios

## Criterios de aceptación (Gherkin)

### Escenario: Submit exitoso redirige
  Cuando el form de `/create-trade` se envía y la API devuelve 201
  Entonces el browser navega a `/verification` (REQ-03)
  Y se preserva el banner "Verificación pendiente" (HU-21.5)

### Escenario: Form action acorde al mockup
  Cuando reviso `<form action>` del wizard
  Entonces refleja el flujo equivalente al `action="dashboard-provider.html"` del mockup (`create-trade.html:50`) pero ahora apuntando a `/verification` por la nueva regla del REQ

### Escenario: Error de servidor mantiene en página
  Cuando POST falla con 5xx
  Entonces el browser permanece en `/create-trade` con mensaje toast rojo

## Tareas técnicas

- [ ] Cliente JS `src/lib/client/onboarding.ts` con fetch + redirect via `window.location.assign("/verification")`
- [ ] Manejo de errores con toast (estilo `mockups/profile.html` patrón de notificación)
- [ ] Tests E2E `tests/e2e/create-trade-flow.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
