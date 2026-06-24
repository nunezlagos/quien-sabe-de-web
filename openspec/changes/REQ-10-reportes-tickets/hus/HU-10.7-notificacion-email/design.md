# Diseno tecnico — HU-10.7 — Notificación por email en cada cambio de estado

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

No introduce tablas. Lee `tickets`, `users` (HU-10.1, REQ-01). El log de emails vive en `email_log` (REQ-17).

Resolución del destinatario:

```ts
async function resolveRecipient(ticket, user): Promise<string | null> {
  if (ticket.contactEmail) return ticket.contactEmail;     // anónimo
  if (user?.email) return user.email;                      // autenticado
  return null;
}
```

## Contrato de API

No añade endpoints. Es un hook interno en `transitionTicket` (HU-10.5).

## Validaciones Zod

No aplica (no expone schema nuevo).

## Componentes UI

No aplica. Templates de email son assets.

Templates:

- `src/lib/services/email/templates/ticket-in-review.html` — placeholders `{{ticketId}}`, `{{subject}}`, `{{recipientName}}`, `{{statusLink}}`.
- `src/lib/services/email/templates/ticket-closed.html` — placeholders `{{ticketId}}`, `{{subject}}`, `{{recipientName}}`, `{{closedAt}}`, `{{supportEmail}}`.

## Flujo de interaccion (secuencial)

1. Admin transiciona ticket (HU-10.5).
2. `validateTransition` retorna `sideEffects` (e.g. `['email_in_review']` o `['email_closed']`).
3. `transitionTicket` ejecuta UPDATE + audit log dentro de transacción.
4. Tras commit exitoso, `executeTicketSideEffects(env, ticket, sideEffects, recipient)`:
   - Para cada sideEffect:
     - `email_in_review` → `EmailService.send('ticket_in_review', { ticketId, subject }, recipient)`.
     - `email_closed` → `EmailService.send('ticket_closed', { ticketId, subject }, recipient)`.
   - Try/catch cada envío; warning loggeado si falla.
5. `email_log` (REQ-17) registra cada intento.

## Capa de servicios

- `src/lib/services/tickets/notifications.ts` (nuevo):
  - `resolveRecipient(ticket, user): Promise<string | null>`.
  - `executeTicketSideEffects(env, ticket, sideEffects, recipient): Promise<void>` — orquesta los envíos.
  - `renderTicketEmailBody(template, ticket, user): string` — helper de render del template.
- `src/lib/services/email/` (REQ-17):
  - `EmailService.send(template, data, to): Promise<void>` — ya implementado en REQ-17.
  - Templates `ticket_in_review.html`, `ticket_closed.html` se registran en el `TemplateRegistry` de REQ-17.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/tickets/notifications.test.ts` | `resolveRecipient` con `contactEmail` poblado → retorna email; con user.email → retorna user.email; sin ambos → null. `executeTicketSideEffects` con sideEffects=['email_in_review'] invoca `EmailService.send` con template correcto; con `email_closed` igual. Si `recipient=null` → no invoca send, loggea warning. |
| Unit | `tests/unit/services/email/templates.test.ts` | Render de `ticket_in_review.html` con datos válidos produce HTML con placeholders reemplazados; mismo para `ticket_closed.html`. |
| Integración | `tests/integration/tickets/email-notification.test.ts` | Contra Mailpit (mock SMTP): transición a en_revision → email recibido en Mailpit con subject correcto y body con ticketId; transición a cerrado → email "ticket cerrado" recibido; ticket sin recipient → no llega email y hay log de warning |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.5 (transiciones), REQ-17 (EmailService).
- **Bloquea a:** ninguna directa (cierra el flujo del solicitante).
- **Recursos compartidos:** `EmailService` (REQ-17), `email_log` (REQ-17).

## Riesgos tecnicos

- Riesgo: `EmailService.send` no es idempotente → un reintento envía duplicado → Mitigación: `email_log` deduplica por `(ticket_id, template, created_at)` con UNIQUE; REQ-17 lo implementa.
- Riesgo: el template usa `{{variable}}` que falla si el dato es undefined → Mitigación: el render del template falla explícitamente; test cubre el caso.
- Riesgo: enviar email a `users.email` filtra el email del admin (si por error se usa el email del admin) → Mitigación: `resolveRecipient` SOLO considera `ticket.contactEmail` o `user.email` (donde user es el `created_by_user_id` del ticket).
- Riesgo: el hook se ejecuta dentro de la transacción y un fallo de email hace rollback → Mitigación: el hook se ejecuta POST-commit (fuera de `db.transaction`).
