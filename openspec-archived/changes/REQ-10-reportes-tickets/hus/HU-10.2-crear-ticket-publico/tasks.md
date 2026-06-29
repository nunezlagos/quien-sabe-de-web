# HU-10.2 — Crear ticket público sin sesión

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.2-crear-ticket-publico`

## Tareas técnicas

- [ ] **T1** Validador `anonymousTicketCreateSchema` en `src/lib/validators/tickets.ts`.
- [ ] **T2** Servicio `createTicket(env, input, session?): Promise<Ticket>` en `src/lib/services/tickets.ts`:
  - Si `session === null && input.kind !== 'consulta'` → `throw new AnonymousCannotReportError()`.
  - `db.transaction`: INSERT ticket + INSERT primer mensaje (`sender='author'`, `body=input.body`, `internal_note=0`).
  - Si `input.contactEmail` → invocar `EmailService.send('ticket_created', ...)` en try/catch.
- [ ] **T3** Template `src/lib/services/email/templates/ticket-created.html` con placeholders `{{ticketId}}`, `{{subject}}`, `{{createdAt}}`.
- [ ] **T4** Endpoint `src/pages/api/v1/tickets.ts` (POST):
  - `rateLimit('rl:ticket:anon:<ip_hash>', 10, 3600)` → 429 si excede (helper de HU-08.2).
  - `Astro.locals.session ?? null` (puede ser null).
  - Validar body con `anonymousTicketCreateSchema` → 422.
  - Try `createTicket`; catch `AnonymousCannotReportError` → 403; otros errores → 500.
  - `successResponse(ticket, 201)`.
- [ ] **T5** Tests:
  - [ ] `tests/unit/validators/tickets.test.ts` (extender) — `anonymousTicketCreateSchema`: kind='consulta' OK; kind='suplantacion' falla; subject 4 chars falla; body 5001 chars falla; contactEmail inválido falla.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `createTicket` anónimo 'consulta' → INSERT con `created_by_user_id=NULL`, `contact_email` poblado; anónimo 'suplantacion' → `AnonymousCannotReportError`; `EmailService.send` mockeado y llamado una vez.
  - [ ] `tests/integration/tickets/create-anonymous.test.ts` — POST happy path → 201 + fila en tickets + fila en ticket_messages con body; kind='suplantacion' anónimo → 403; subject corto → 422; sin email → 422; 11 requests → 429.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: comentar el rate-limit → test "11 requests → 429" cae → restaurar
- [ ] Sabotaje 2: quitar el chequeo `session === null && kind !== 'consulta'` → test "kind suplantacion anónimo → 403" cae → restaurar
- [ ] Sabotaje 3: en `createTicket`, no incluir `contact_email` en el INSERT cuando es anónimo → test "ticket tiene contact_email poblado" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets.ts` (rama createTicket)
- [ ] Type check verde
- [ ] Commit `feat: POST /tickets público anónimo solo para consulta` y push
