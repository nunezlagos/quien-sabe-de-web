# HU-10.6 — Hilo de mensajes con notas internas

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** admin y solicitante
**Quiero** intercambiar mensajes en el ticket; el admin puede dejar notas internas
**Para** tener un hilo de conversación auditable

## Criterios de aceptación (Gherkin)

### Escenario: Agregar mensaje del autor
  Dado un autor del ticket
  Cuando envía `POST /api/v1/tickets/<id>/messages` con `{"body":"Más info"}`
  Entonces recibo status 201
  Y `internal_note=false`

### Escenario: Admin agrega nota interna
  Cuando admin envía `{"body":"sospechoso","internal_note":true}`
  Entonces se crea con `internal_note=true`

### Escenario: Autor NO ve notas internas en GET
  Dado un mensaje con `internal_note=true`
  Cuando el autor envía `GET /api/v1/tickets/<id>`
  Entonces ese mensaje NO aparece en el hilo

### Escenario: Admin SÍ ve todos los mensajes
  Cuando admin envía GET
  Entonces ve todos los mensajes incluidos los internos

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/tickets/[id]/messages.ts`
- [ ] Endpoint `GET /api/v1/tickets/[id].ts` que filtra `internal_note` según rol
- [ ] Tests `tests/integration/tickets/messages.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
