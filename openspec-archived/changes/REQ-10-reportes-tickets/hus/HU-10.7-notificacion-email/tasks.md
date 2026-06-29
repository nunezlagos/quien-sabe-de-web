# HU-10.7 — Notificación por email en cada cambio de estado

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.7-notificacion-email`

## Tareas técnicas

- [ ] **T1** Templates `src/lib/services/email/templates/ticket-in-review.html` y `ticket-closed.html` con placeholders `{{ticketId}}`, `{{subject}}`, `{{recipientName}}`, `{{statusLink}}` (sólo in-review) / `{{closedAt}}` (sólo closed).
- [ ] **T2** Registrar los templates en `TemplateRegistry` de REQ-17 (`src/lib/services/email/index.ts`).
- [ ] **T3** Servicio `src/lib/services/tickets/notifications.ts`:
  - `resolveRecipient(ticket, user | null): string | null`:
    - `ticket.contactEmail` → ese.
    - Else `user?.email` → ese.
    - Else `null`.
  - `executeTicketSideEffects(env, ticket, sideEffects, recipient): Promise<void>`:
    - Iterar `sideEffects`; por cada uno:
      - `email_in_review` → `EmailService.send('ticket_in_review', { ticketId: ticket.id, subject: 'Ticket en revisión', recipientName: user?.name ?? 'vecino' }, recipient)`.
      - `email_closed` → `EmailService.send('ticket_closed', { ticketId: ticket.id, subject: 'Tu ticket fue cerrado' }, recipient)`.
    - Try/catch cada envío; warning log.
    - Si `recipient === null` → no enviar, warning.
- [ ] **T4** Integrar `executeTicketSideEffects` en `src/lib/services/tickets.ts` `transitionTicket` POST-commit:
  - Resolver user (`db.select().from(users).where(eq(users.id, ticket.createdByUserId)).get()` si no null).
  - `const recipient = await resolveRecipient(ticket, user)`.
  - `await executeTicketSideEffects(env, ticket, sideEffects, recipient)`.
- [ ] **T5** Tests:
  - [ ] `tests/unit/services/tickets/notifications.test.ts` — `resolveRecipient`: ticket con contactEmail → ese; ticket sin contactEmail + user con email → user.email; sin ambos → null.
  - [ ] `tests/unit/services/tickets/notifications.test.ts` — `executeTicketSideEffects` con `['email_in_review']` y recipient → llama `EmailService.send('ticket_in_review', ...)` una vez; con `['email_closed']` llama `EmailService.send('ticket_closed', ...)`; con recipient=null → no llama y loggea warning.
  - [ ] `tests/unit/services/tickets/notifications.test.ts` — si `EmailService.send` lanza excepción → warning loggeado, no propaga el error.
  - [ ] `tests/unit/services/email/templates.test.ts` — render de `ticket_in_review.html` con datos válidos; placeholders reemplazados; HTML escapado.
  - [ ] `tests/integration/tickets/email-notification.test.ts` — Mailpit (o mock SMTP): ticket con `contact_email='test@example.com'` se transiciona a en_revision → email recibido; transición a cerrado → email "ticket cerrado" recibido; ticket sin recipient → no llega email y log contiene warning.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `resolveRecipient`, retornar `ticket.contactEmail` aunque sea NULL (no checkear) → test "sin recipient → no envía" cae (envía string vacía) → restaurar
- [ ] Sabotaje 2: ejecutar `executeTicketSideEffects` DENTRO de la transacción de `transitionTicket` → sabotaje más sutil: simular `EmailService.send` que lance excepción → test "transición completa aunque email falle" cae → restaurar (mover hook POST-commit)
- [ ] Sabotaje 3: hardcodear el template como `'ticket_closed'` siempre → test "transición a en_review envía template correcto" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets/notifications.ts`
- [ ] Type check verde
- [ ] Commit `feat: emails automáticos al cambiar estado del ticket` y push
