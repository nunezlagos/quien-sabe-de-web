# HU-10.1 — Schema tickets + ticket_messages

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.1-schema-tickets`

## Tareas técnicas

- [ ] **T1** Editar `src/database/schema.ts` agregando `tickets` y `ticketMessages` con tipos, FKs (CASCADE/SET NULL según corresponda) e índices según `design.md`.
- [ ] **T2** Generar migración con `docker exec quien-sabe-app bun run db:generate`.
- [ ] **T3** Editar SQL manualmente para agregar CHECKs:
  - `tickets.kind IN ('suplantacion','mal_servicio','contenido','consulta')`.
  - `tickets.status IN ('abierto','en_revision','cerrado')`.
  - `ticket_messages.body length BETWEEN 1 AND 5000`.
- [ ] **T4** Aplicar: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T5** Stubs en `src/lib/services/tickets.ts` con firmas y `throw new Error('not implemented yet')` para todas las funciones listadas en `design.md`.
- [ ] **T6** Validadores en `src/lib/validators/tickets.ts`: `ticketKindSchema`, `ticketStatusSchema`, `ticketSenderSchema`, `ticketCreateSchema` con refinements.
- [ ] **T7** Tests:
  - [ ] `tests/integration/tickets/schema.test.ts` — INSERT válido en ambas tablas; CHECK kind rechaza 'rastreo'; CHECK status rechaza 'otro'; CHECK body rechaza 5001 chars; FK a users falla con id inexistente; FK a providers CASCADE borra tickets; FK a users SET NULL mantiene ticket con assignee_admin_id NULL.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: cambiar `CHECK (kind IN ('suplantacion','mal_servicio','contenido','consulta'))` por una versión sin 'contenido' → test "CHECK kind rechaza 'rastreo'" igual pasa (no es sabotaje efectivo); mejor sabotaje: cambiar `CHECK (status IN ('abierto','en_revision','cerrado'))` por `CHECK (status IN ('abierto','en_revision'))` → test "CHECK status rechaza 'cerrado'" falla → restaurar
- [ ] Sabotaje 2: cambiar `ON DELETE CASCADE` por `ON DELETE SET NULL` en `target_provider_id` → test "FK cascade borra tickets al borrar provider" cae (los tickets quedan con target_provider_id NULL) → restaurar
- [ ] Sabotaje 3: cambiar `ON DELETE SET NULL` por `ON DELETE CASCADE` en `assignee_admin_id` → test "SET NULL mantiene ticket al borrar admin" cae (los tickets se borran) → restaurar
- [ ] Coverage ≥ 90 % (sólo stubs cuentan; bajo coverage es aceptable, pero los tests de schema validan el 100 % de las constraints)
- [ ] Type check verde
- [ ] Commit `feat: schema tickets + ticket_messages con CHECK y FK` y push
