# HU-12.6 — Banner de estado de verificación

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver claramente si mi verificación está pendiente o rechazada
**Para** saber qué pasos seguir para aparecer en búsqueda

## Criterios de aceptación (Gherkin)

### Escenario: Banner pendiente
  Dado un prestador con verificación `pendiente`
  Cuando entra al dashboard
  Entonces ve un banner amarillo: "Tu verificación está en revisión"

### Escenario: Banner rechazado con CTA reenviar
  Dado verificación `rechazado` con motivo
  Cuando entra al dashboard
  Entonces ve banner rojo con el motivo y botón "Reenviar"
  Y el click va a `/verification`

### Escenario: Sin banner si verificado
  Dado verificación `verificado`
  Cuando renderiza
  Entonces el banner no se muestra

## Tareas técnicas

- [ ] Componente `src/components/dashboard/provider/VerificationBanner.astro`
- [ ] Helper SSR `getVerificationStatus(userId)`
- [ ] Mockup: agregar en `mockups/dashboard-provider.html` (antes del bloque línea 126 — Profile Edit Form) banner amarillo `bg-yellow-50` con icono y texto 'Tu verificación está en revisión' cuando `verification.status='pendiente'`. Si rechazado, banner rojo con el motivo.
- [ ] Tests `tests/e2e/provider-verification-banner.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
