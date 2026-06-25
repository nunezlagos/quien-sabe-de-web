# HU-17.5 — Template de cambio de estado de ticket

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** solicitante de ticket
**Quiero** recibir email en cada cambio de estado
**Para** estar informado del progreso

## Criterios de aceptación (Gherkin)

### Escenario: Email cuando pasa a en_revision
  Cuando un ticket pasa a `en_revision`
  Entonces se envía `ticket_in_review` al solicitante

### Escenario: Email cuando se cierra
  Cuando un ticket se cierra
  Entonces se envía `ticket_closed` con resumen y un CTA "responder por email"

## Tareas técnicas

- [ ] Templates `ticket_in_review.html.ts`, `ticket_closed.html.ts`
- [ ] Tests `tests/integration/email/tickets.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
