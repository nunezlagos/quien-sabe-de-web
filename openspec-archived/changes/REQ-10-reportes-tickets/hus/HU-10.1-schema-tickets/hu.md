# HU-10.1 — Schema tickets + ticket_messages

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** sistema
**Quiero** modelar tickets de soporte y su hilo de mensajes
**Para** operar la cola de soporte con trazabilidad

## Criterios de aceptación (Gherkin)

### Escenario: Migración crea tablas
  Cuando se aplica la migración
  Entonces existen `tickets(id, kind, status, assignee_admin_id, target_provider_id, created_by_user_id, contact_email, created_at)` y `ticket_messages(id, ticket_id, sender, body, internal_note, created_at)`
  Y FK a `users` para `created_by_user_id` y `assignee_admin_id`

### Escenario: Status enum válido
  Cuando intento insertar `status="otro"`
  Entonces el CHECK falla — sólo `abierto|en_revision|cerrado`

### Escenario: Kind enum válido
  Cuando intento insertar `kind="rastreo"`
  Entonces el CHECK falla — sólo `suplantacion|mal_servicio|contenido|consulta`

## Tareas técnicas

- [ ] Schema `tickets`, `ticket_messages` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_tickets.sql`
- [ ] Tests `tests/integration/tickets/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
