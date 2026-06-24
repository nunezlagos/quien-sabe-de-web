# Propuesta — HU-10.6 — Hilo de mensajes con notas internas

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

El ticket necesita un hilo de conversación entre el solicitante y el admin. Adicionalmente, el admin puede dejar notas internas que NO son visibles para el solicitante — esto es crítico para no exponer análisis interno (sospecha de fraude, coordinación entre admins, etc.). El modelado es: mensajes con `sender='author'|'admin'|'system'` y flag `internal_note`. El autor del ticket NO ve mensajes con `internal_note=true`; el admin SÍ los ve.

## Mockups de referencia

- Mockup TBD para vista detalle del ticket (no existe aún). Sigue el patrón de hilos: avatar + nombre + body + timestamp, mensajes internos con borde distintivo.

## Alternativas consideradas

### Opcion A — `internal_note` como columna bool en `ticket_messages`, filtrada por rol en GET
- Autor: `WHERE internal_note = 0`.
- Admin: sin filtro.
- Pro: simple; una sola tabla; query trivial.
- Contra: si el admin edita una nota interna a pública (no soportado), requiere UPDATE; OK.

### Opcion B — Dos tablas separadas `ticket_messages` y `ticket_internal_notes`
- Pro: aislamiento físico; el solicitante ni siquiera sabe que existe la tabla.
- Contra: doble query para el admin; complica el orden cronológico (mezclar de dos tablas).

### Opcion C — Campo `visibility` con `public|internal|admin_only`
- Más flexible.
- Contra: over-engineering; sólo necesitamos 2 niveles.

## Decision

Se elige **Opcion A**. La columna `internal_note` (HU-10.1) es la fuente de verdad. El filtrado por rol se hace en el GET. La query usa el índice `idx_ticket_messages_ticket_public (ticket_id, internal_note, created_at)`.

## Riesgos y mitigaciones

- Riesgo: el autor del ticket ve notas internas por error → Mitigación: el servicio `getTicketById` recibe `session` y filtra `internal_note=0` cuando `role !== 'admin'`. Test explícito: autor NO ve `internal_note=true`.
- Riesgo: el admin publica accidentalmente una nota como pública → Mitigación: el form de admin tiene un checkbox "Nota interna (no visible al solicitante)" que default a `false` para reducir errores.
- Riesgo: el orden de mensajes se rompe si dos tienen mismo `created_at` → Mitigación: tiebreaker `id ASC` (los IDs son auto-increment, orden estable).
- Riesgo: el autor autenticado envía mensaje pero ya no tiene user válido (cuenta borrada) → Mitigación: `created_by_user_id` en el ticket es `SET NULL`; el mensaje del autor persiste con `sender='author'` y FK `SET NULL`.

## Metrica de exito

- POST `internal_note=false` por autor → 201 + aparece en GET del autor.
- POST `internal_note=true` por admin → 201 + NO aparece en GET del autor; SÍ aparece en GET del admin.
- GET del autor filtra mensajes con `internal_note=true` → no los incluye.
- GET del admin no filtra → incluye todos.
- POST `body` vacío → 422.
- POST sin sesión → 401.
- POST por usuario que NO es autor NI admin → 403.
