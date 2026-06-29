# HU-17.5 — Template de cambio de estado de ticket

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.5-template-ticket`

## Tareas tecnicas

- [ ] **T1** Crear `ticket_in_review.html.ts` y `ticket_in_review.txt.ts` con `render(vars)`. Vars: `{ ticketId, ticketSubject, ticketUrl }`. HTML escapa `ticketSubject`. Subject: "Tu ticket {ticketId} está en revisión".
- [ ] **T2** Crear `ticket_closed.html.ts` y `ticket_closed.txt.ts` con `render(vars)`. Vars: `{ ticketId, ticketSubject, summary[], replyTo, ticketUrl }`. Render condicional: si `summary.length > 0`, lista `<li>` escapados. CTA "Responder por email" usa `mailto:replyTo?subject=Re: T-{id}`. Subject: "Tu ticket {ticketId} fue cerrado".
- [ ] **T3** Registrar ambos en `src/lib/services/email/templates/index.ts` con sus `varsSchema`.
- [ ] **T4** Localizar o crear `src/lib/services/tickets/transitions.ts`. Si no existe, extraer la lógica de cambio de estado del handler de REQ-10 a un servicio con DI.
- [ ] **T5** Modificar `transitions.update(...)` para aceptar `emailService` por DI y emitir `ticket_in_review` o `ticket_closed` según `toStatus`. Si `requester_email` es null, skip con log warning.
- [ ] **T6** Tests:
  - [ ] `tests/unit/email/templates/ticket-in-review.test.ts` — render normal; varsSchema rechaza `ticketSubject` > 200.
  - [ ] `tests/unit/email/templates/ticket-closed.test.ts` — render con summary de 3 items; render con summary vacío oculta sección; varsSchema rechaza `summary` con > 10 items.
  - [ ] `tests/integration/email/tickets.test.ts` — mock `emailService`; transición a `en_revision` produce 1 send con `template:'ticket_in_review'`; a `closed` produce 1 send con `template:'ticket_closed'` y summary; ticket sin `requester_email` → 0 sends + log warning.
  - [ ] Test explícito: si `emailService.send` lanza, la transición commitea igual.
- [ ] **T7** Verificar manualmente: crear ticket de prueba, cambiar a `en_revision`, revisar Mailpit; cerrar, revisar Mailpit; verificar formato y escape.

## Sabotajes a confirmar

1. En `ticket_closed.html.ts`, no escapar el `ticketSubject` → test unitario con subject que contiene `<script>` y assert de escape falla → restaurar.
2. En `transitions.update`, olvidar el switch sobre `toStatus` y emitir siempre `ticket_in_review` → test integración que verifica `template:'ticket_closed'` al cerrar falla → restaurar.
3. En `transitions.update`, no implementar el skip cuando `requester_email` es null → test que crea ticket anónimo y espera 0 sends recibe 1 send → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/email/templates/ticket-in-review.test.ts tests/unit/email/templates/ticket-closed.test.ts tests/integration/email/tickets.test.ts` → verde
- [ ] Sabotaje 1 confirmado: sin escape → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: switch omitido → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: skip omitido → test rojo → restaurar
- [ ] Coverage ≥ 90 % en los 4 templates y `tickets/transitions.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: templates ticket_in_review y ticket_closed` y push a rama (no merge a main)
