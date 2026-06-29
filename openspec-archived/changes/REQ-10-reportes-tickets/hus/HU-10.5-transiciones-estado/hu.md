# HU-10.5 — Transiciones de estado de ticket con auditoría

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** admin
**Quiero** transicionar el estado de un ticket y asignarlo
**Para** manejar el ciclo de vida del ticket

## Criterios de aceptación (Gherkin)

### Escenario: Transición abierto → en_revision
  Cuando admin envía `PATCH /api/v1/admin/tickets/<id>` con `{"status":"en_revision","assignee_admin_id":<self>}`
  Entonces recibo status 200 y se audita la acción

### Escenario: Transición en_revision → cerrado dispara email
  Cuando admin transiciona a `cerrado`
  Entonces se envía email `ticket_closed` al solicitante (vía REQ-17)

### Escenario: Transición inválida → 409
  Dado un ticket en `cerrado`
  Cuando intento volver a `abierto`
  Entonces recibo status 409 con `{ "error": "transición inválida" }`

## Tareas técnicas

- [ ] Máquina de estados `src/lib/services/tickets/stateMachine.ts`
- [ ] Endpoint `src/pages/api/v1/admin/tickets/[id].ts`
- [ ] Auditoría en `admin_audit_log`
- [ ] Tests `tests/unit/tickets/state-machine.test.ts`, `tests/integration/admin/tickets-transition.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
