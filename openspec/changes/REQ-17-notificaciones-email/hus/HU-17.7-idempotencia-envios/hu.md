# HU-17.7 — Idempotencia (template, recipient, entity)

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** sistema
**Quiero** no enviar el mismo email dos veces
**Para** evitar spam y desconfianza

## Criterios de aceptación (Gherkin)

### Escenario: Constraint único previene duplicado
  Dado un email enviado con `(template="welcome", recipient="ana@ejemplo.cl", related_entity="user:42")`
  Cuando se intenta enviar uno idéntico
  Entonces `EmailService.send` retorna `{status:"skipped", reason:"duplicate"}` sin tocar el adapter

### Escenario: Idempotencia respeta retry tras fallo
  Dado un envío anterior con `status="failed"`
  Cuando se reintenta
  Entonces se envía nuevamente y se loguea

### Escenario: Sin related_entity NO aplica idempotencia
  Dado un envío sin `related_entity`
  Cuando se invoca de nuevo
  Entonces se envía igual (decisión: idempotencia opt-in)

## Tareas técnicas

- [ ] Índice único parcial `email_log (template, recipient, related_entity) WHERE status='sent'`
- [ ] Lógica en `EmailService.send` que verifica antes de enviar
- [ ] Tests `tests/integration/email/idempotency.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
