# Diseno tecnico — HU-10.2 — Crear ticket público sin sesión

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

INSERT en `tickets` (HU-10.1) + INSERT en `ticket_messages` (primer mensaje = body):

```sql
BEGIN;
INSERT INTO tickets (kind, status, contact_email, created_at)
VALUES ('consulta', 'abierto', :contactEmail, :nowSec);

INSERT INTO ticket_messages (ticket_id, sender, body, internal_note, created_at)
VALUES (:ticketId, 'author', :body, 0, :nowSec);
COMMIT;
```

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/tickets` | POST | público (con rate-limit) | `{ kind: 'consulta', subject: 5..150, body: 1..5000, contactEmail: email }` | `{ id, status, kind, createdAt }` | 422 (Zod), 403 (anónimo con kind ≠ consulta), 429 (rate-limit) |

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (extender)
export const anonymousTicketCreateSchema = z.object({
  kind: z.literal('consulta'),
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
  contactEmail: z.string().email(),
});
```

(El schema completo `ticketCreateSchema` con refine para kind vs target_provider_id está en HU-10.1; el endpoint usa `anonymousTicketCreateSchema` para forzar `kind=consulta`.)

## Componentes UI

No aplica en esta HU (formulario de contacto anónimo es REQ futura; mockup TBD).

## Flujo de interaccion (secuencial)

1. Visitante anónimo envía `POST /api/v1/tickets` con `{ kind: 'consulta', subject, body, contactEmail }`.
2. Handler en `src/pages/api/v1/tickets.ts`:
   a. Rate-limit `checkAndIncrement('rl:ticket:anon:<ip_hash>', 10, 3600)` → 429 si excede.
   b. Validar body con `anonymousTicketCreateSchema` → 422.
   c. Transacción: INSERT ticket + INSERT mensaje inicial.
   d. Invocar `EmailService.send('ticket_created', { ticketId, subject }, contactEmail)` (vía REQ-17). Si falla → log warning, ticket igual se crea (no bloqueante).
   e. `successResponse(ticket, 201)`.
3. Cliente recibe 201 con `id` para tracking futuro.

## Capa de servicios

- `src/lib/services/tickets.ts` (implementar `createTicket`):
  - Si `session === undefined && input.kind !== 'consulta'` → `throw new AnonymousCannotReportError()`.
  - Transacción con INSERT ticket + INSERT mensaje.
  - `EmailService.send` best-effort.
- `src/lib/services/email/templates/ticket-created.html` (template, vía REQ-17).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/tickets.test.ts` (extender) | `anonymousTicketCreateSchema`: kind debe ser 'consulta'; subject 5..150; body 1..5000; contactEmail email válido |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | `createTicket` sin sesión + kind='consulta' → crea fila con `created_by_user_id=NULL`; sin sesión + kind='suplantacion' → `AnonymousCannotReportError`; EmailService mockeado y llamado |
| Integración | `tests/integration/tickets/create-anonymous.test.ts` | POST → 201 + fila en tickets + fila en ticket_messages; kind='suplantacion' anónimo → 403; subject corto → 422; sin contact_email → 422; 11 requests en <1h → 429 al 11° |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.1 (schema), HU-08.2 (rate-limit helper).
- **Bloquea a:** REQ-17 (notificaciones), HU-10.5 (transiciones), HU-10.7 (emails).
- **Recursos compartidos:** `checkAndIncrement` (HU-08.2), binding KV.

## Riesgos tecnicos

- Riesgo: el rate-limit comparte el contador con REQ-08 (contactos) → Mitigación: prefijo distinto `rl:ticket:anon:`.
- Riesgo: `EmailService.send` lanza excepción que mata la transacción → Mitigación: try/catch alrededor del envío; el ticket ya está commiteado.
- Riesgo: IP detrás de NAT hace que 100 personas cuenten como 1 → Mitigación: documentar; aceptable para "consulta" (no es ataque).
- Riesgo: el subject se guarda en el primer mensaje y no en `tickets` → Mitigación: para HU-10.2 no se persiste `subject` en `tickets`; queda en el primer `ticket_messages.body` prefijado con `[subject]`. Decisión documentada; refactor futuro si se quiere columna `subject` en `tickets`.
