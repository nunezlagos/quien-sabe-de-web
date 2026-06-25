# HU-21.4 — Redirect post-wizard a /verification

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** prestador que terminó el wizard
**Quiero** ir directo al flujo de verificación
**Para** completar mi proceso sin pasos intermedios

## Criterios de aceptación (Gherkin)

### Escenario: Submit exitoso redirige
  Cuando el form de `/create-trade` se envía y la API devuelve 201
  Entonces el browser navega a `/verification` (REQ-03)
  Y se preserva el banner "Verificación pendiente" (HU-21.5)

### Escenario: Submit redirige a /verification
  Dado que el wizard está en paso final
  Cuando envío el form con `fetch POST /api/v1/providers/me` y devuelve 201
  Entonces `window.location.assign('/verification')` se ejecuta desde `src/lib/client/onboarding/navigation.ts`
  Y NO se usa `<form action>` HTML (la implementación es JS, no form submission tradicional)

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
