# Diseno tecnico — HU-10.6 — Hilo de mensajes con notas internas

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

INSERT en `ticket_messages` (HU-10.1) con `sender` y `internal_note`:

```sql
INSERT INTO ticket_messages (ticket_id, sender, body, internal_note, created_at)
VALUES (:ticketId, :sender, :body, :internalNote, :nowSec);
```

El GET del autor filtra:

```sql
SELECT id, sender, body, created_at
FROM ticket_messages
WHERE ticket_id = :ticketId AND internal_note = 0
ORDER BY created_at ASC, id ASC;
```

El GET del admin no filtra `internal_note`.

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 201 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/tickets/:id/messages` | POST | sesión (autor o admin) | `id` numérico | `{ body: 1..5000, internalNote?: boolean (sólo admin) }` | `{ id, sender, body, internalNote, createdAt }` | 401, 403, 404 (ticket no existe o autor no es el dueño), 422 |
| `/api/v1/tickets/:id` | GET | sesión (autor o admin) | `id` numérico | — | `{ id, status, ..., messages: TicketMessage[] }` (autor: sin `internalNote=true`; admin: todos) | 401, 403, 404 |

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (extender)
export const ticketMessageCreateSchema = z.object({
  body: z.string().min(1).max(5000),
  internalNote: z.boolean().optional(),
}).refine(
  (v) => v.internalNote === undefined || v.internalNote === false || v.internalNote === true,
  { message: 'internalNote debe ser booleano' }
);
```

## Componentes UI

Mockup TBD. La estructura esperada:

- Lista cronológica ASC de mensajes.
- Cada item: avatar del sender, nombre, timestamp, body. Si `internalNote` → borde amarillo y etiqueta "Nota interna".
- Form al final:
  - Si autor: `<textarea>` + botón "Enviar".
  - Si admin: `<textarea>` + checkbox "Nota interna" + botón "Enviar".

## Flujo de interaccion (secuencial)

### POST mensaje

1. Cliente envía `POST /api/v1/tickets/<id>/messages`.
2. Handler:
   a. `requireSession(Astro)` → 401.
   b. `getTicketById` (incluyendo filtrado por visibilidad) → 404 si null.
   c. Verificar acceso: si rol=user, `ticket.created_by_user_id === session.user.id`; si rol=admin, OK; otros → 403.
   d. Si `session.role !== 'admin' && input.internalNote === true` → 403 (sólo admin puede dejar notas).
   e. Validar body con `ticketMessageCreateSchema` → 422.
   f. `addMessage(env, ticketId, sender, body, internalNote)`:
      - `sender`: si admin → 'admin'; si autor → 'author'.
   g. 201.

### GET ticket

1. Cliente envía `GET /api/v1/tickets/<id>`.
2. Handler:
   a. `requireSession(Astro)` → 401.
   b. `getTicketById(env, id, session)`:
      - Si admin → query completa + `listMessages(env, id, isAdmin=true)`.
      - Si autor → query + `listMessages(env, id, isAdmin=false)`.
      - Si no admin y no autor → 403.
   c. 200 con `{ ...ticket, messages }`.

## Capa de servicios

- `src/lib/services/tickets.ts`:
  - `addMessage(env, ticketId, sender, body, internalNote): Promise<TicketMessage>`.
  - `listMessages(env, ticketId, isAdmin): Promise<TicketMessage[]>` — query con/sin filtro `internal_note`.
  - `getTicketForViewer(env, ticketId, session): Promise<TicketWithMessages | null>`:
    - 404 si ticket no existe.
    - 403 si no admin y no autor.
    - Si admin: messages con internalNote=true incluidos.
    - Si autor: messages sólo con internalNote=false.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/tickets.test.ts` (extender) | `ticketMessageCreateSchema`: body 1..5000; internalNote opcional; sin sesión con internalNote=true falla validación de rol (no Zod, sino lógica de servicio) |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | `listMessages(isAdmin=true)` incluye internalNote=true; `listMessages(isAdmin=false)` los excluye; `getTicketForViewer` con autor no-admin filtra mensajes internos |
| Integración | `tests/integration/tickets/messages.test.ts` | POST mensaje de autor → 201; POST internalNote=true por autor → 403; POST internalNote=true por admin → 201; GET autor no ve internalNote; GET admin ve todos; body 5001 → 422; sin sesión → 401; GET por otro user → 403 |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.1 (schema), HU-10.5 (transición que dispara email también puede añadir mensaje de sistema).
- **Bloquea a:** HU-10.7 (algunos emails referencian mensajes del hilo).
- **Recursos compartidos:** `requireSession`, `getTicketById` extendido.

## Riesgos tecnicos

- Riesgo: el orden cronológico usa `created_at` con precisión de segundo y dos mensajes en el mismo segundo rompen el orden → Mitigación: tiebreaker `id ASC`; el ID auto-increment garantiza orden estable.
- Riesgo: `internal_note` por defecto en false pero el form podría mandar `undefined` → Mitigación: el servicio normaliza `internalNote ?? false`.
- Riesgo: el autor quiere ver "qué escribió el admin" pero el admin nunca escribe mensajes públicos → Mitigación: aceptable; el email `ticket_closed` (HU-10.7) cubre la comunicación.
- Riesgo: el admin publica una nota sensible (PII) por error → Mitigación: el checkbox "Nota interna" default false reduce accidentes; training del admin fuera de scope.
