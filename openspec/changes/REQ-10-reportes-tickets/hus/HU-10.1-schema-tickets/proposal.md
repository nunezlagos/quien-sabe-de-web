# Propuesta — HU-10.1 — Schema tickets + ticket_messages

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

El sistema de tickets es el canal formal de soporte y reporte. Un ticket es creado por un solicitante (autenticado o anónimo) y atendido por un admin. Tiene un `kind` (tipo de reporte), un `status` (estado en el flujo), un asignado opcional, y un hilo de mensajes. La separación entre `tickets` (metadata) y `ticket_messages` (hilo) es estándar y permite paginar mensajes sin tocar la fila del ticket. Vínculo con OE1 (calidad y confianza de la plataforma).

## Mockups de referencia

- HU 100% backend (DDL). Las HUs siguientes (10.2-10.7) construyen UI/endpoints sobre este schema.
  - `mockups/profile.html:238-296` — modal "Reportar / Ayuda" (origen de los tickets de tipo reporte contra prestador).
  - `mockups/dashboard-admin.html:225-264` — patrón de cola admin con badges de estado.

## Alternativas consideradas

### Opcion A — Dos tablas `tickets` y `ticket_messages` con FK y CHECKs sobre enum
- `tickets(id, kind, status, assignee_admin_id, target_provider_id, created_by_user_id, contact_email, created_at)`.
- `ticket_messages(id, ticket_id, sender, body, internal_note, created_at)`.
- CHECKs sobre `kind` y `status`; FKs con `ON DELETE` adecuado.
- Pro: simple; cada tabla tiene una responsabilidad clara.
- Contra: las queries de listado (HU-10.4) requieren JOIN con `users` (admin, solicitante); aceptable.

### Opcion B — Tabla única con `messages JSON`
- `tickets(id, ..., messages: JSON)`.
- Pro: una sola tabla; lectura en una query.
- Contra: SQLite no indexa dentro de JSON; paginar mensajes es lento.
- Contra: `internal_note` filtering (HU-10.6) es costoso.

### Opcion C — Tickets como eventos append-only sobre una tabla genérica `support_events`
- Pro:统一 tabla de "eventos de soporte".
- Contra: complica la máquina de estados; queries de "tickets abiertos" son lentas.

## Decision

Se elige **Opcion A**. Es el patrón estándar y permite que HU-10.6 (notas internas) use una columna `internal_note` con índice. Las FKs reflejan las reglas de negocio: borrar un admin no debe borrar tickets (SET NULL); borrar un prestador debe borrar tickets referenciándolo (CASCADE) para no dejar punteros colgantes.

## Riesgos y mitigaciones

- Riesgo: tickets referenciando prestadores borrados quedan invisibles → Mitigación: `ON DELETE CASCADE` en `target_provider_id` borra tickets al borrar provider. Si el provider se soft-deleted, el ticket sigue visible (status del provider no afecta).
- Riesgo: admin borrado pierde su `assignee_admin_id` → Mitigación: `ON DELETE SET NULL` para mantener la fila del ticket.
- Riesgo: `contact_email` queda NULL en tickets autenticados → Mitigación: permitido (el solicitante es user, no email); en HU-10.7 se usa `created_by_user_id` o `contact_email` según haya.
- Riesgo: `internal_note` indexado incorrectamente → Mitigación: la query de HU-10.6 usa `WHERE ticket_id=? AND internal_note=?`; índice `(ticket_id, internal_note)` lo cubre.

## Metrica de exito

- `docker exec quien-sabe-app bun run db:migrate:local` aplica sin errores.
- INSERT con `status='otro'` → CHECK falla.
- INSERT con `kind='rastreo'` → CHECK falla.
- INSERT con `assignee_admin_id` inexistente → FK falla.
- INSERT con `target_provider_id` inexistente → FK falla.
- `EXPLAIN QUERY PLAN SELECT * FROM ticket_messages WHERE ticket_id=? AND internal_note=0 ORDER BY created_at` usa el índice `(ticket_id, internal_note, created_at)`.
