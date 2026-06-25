# HU-10.7 — Notificación por email en cada cambio de estado

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** solicitante
**Quiero** recibir un email cuando mi ticket cambia de estado
**Para** estar al tanto sin tener que loguearme

## Criterios de aceptación (Gherkin)

### Escenario: Email al cerrar ticket
  Dado un ticket con `contact_email="juan@ejemplo.cl"`
  Cuando admin transiciona a `cerrado`
  Entonces se invoca `EmailService.send("ticket_closed", { ticket_id, subject }, "juan@ejemplo.cl")`
  Y queda log en `email_log`

### Escenario: Email al pasar a en_revision
  Cuando admin asigna y pasa a `en_revision`
  Entonces se envía template `ticket_in_review`

### Escenario: Sin email contacto y sin user → no enviar
  Dado un ticket sin `contact_email` y sin `created_by_user_id`
  Cuando se transiciona
  Entonces NO se intenta envío y se loguea warning

## Tareas técnicas

- [ ] Templates `ticket_in_review.html`, `ticket_closed.html` en `src/lib/services/email/templates/`
- [ ] Hook en la máquina de estados que invoca `EmailService`
- [ ] Tests `tests/integration/tickets/email-notification.test.ts` contra Mailpit

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
