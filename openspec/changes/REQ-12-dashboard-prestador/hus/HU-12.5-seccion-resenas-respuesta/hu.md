# HU-12.5 — Sección de reseñas recibidas con respuesta

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver las reseñas que recibí y responder
**Para** interactuar con mis clientes

## Criterios de aceptación (Gherkin)

### Escenario: GET reseñas recibidas
  Cuando envía `GET /api/v1/providers/me/reviews`
  Entonces recibo todas las reseñas del prestador en sesión, incluidas las ocultas (visibles sólo para él con flag)

### Escenario: Responder reseña
  Dado una reseña sin respuesta
  Cuando envía POST response
  Entonces se crea y se ve en la UI

### Escenario: Reseña oculta con marker en UI
  Dado una reseña con `status="hidden"`
  Cuando se renderiza
  Entonces aparece con badge "Oculta por moderación" y motivo

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/reviews.ts`
- [ ] Componente `src/components/dashboard/provider/ReviewsSection.astro` con formulario de respuesta
- [ ] Reuso POST response (REQ-09)
- [ ] Tests `tests/integration/providers/reviews-received.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
