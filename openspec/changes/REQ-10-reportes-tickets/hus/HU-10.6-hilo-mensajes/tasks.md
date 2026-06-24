# HU-10.6 — Hilo de mensajes con notas internas

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.6-hilo-mensajes`

## Tareas técnicas

- [ ] **T1** Validador `ticketMessageCreateSchema` en `src/lib/validators/tickets.ts`.
- [ ] **T2** Servicio `addMessage(env, ticketId, sender, body, internalNote): Promise<TicketMessage>` en `src/lib/services/tickets.ts`.
- [ ] **T3** Servicio `listMessages(env, ticketId, isAdmin): Promise<TicketMessage[]>`:
  - Si `isAdmin=true` → `WHERE ticket_id=? ORDER BY created_at ASC, id ASC`.
  - Si `isAdmin=false` → `AND internal_note=0`.
- [ ] **T4** Servicio `getTicketForViewer(env, ticketId, session): Promise<TicketWithMessages | null>`:
  - Si ticket no existe → return null (handler mapea a 404).
  - Si `session.role !== 'admin' && ticket.created_by_user_id !== session.user.id` → return null con flag `forbidden=true` (handler mapea a 403).
  - Si admin: `messages = listMessages(env, ticketId, true)`.
  - Si autor: `messages = listMessages(env, ticketId, false)`.
- [ ] **T5** Endpoint `src/pages/api/v1/tickets/[id].ts` (GET):
  - `requireSession` → 401.
  - `getTicketForViewer` → null forbidden → 403; null not found → 404; else 200 con messages.
- [ ] **T6** Endpoint `src/pages/api/v1/tickets/[id]/messages.ts` (POST):
  - `requireSession` → 401.
  - `getTicketForViewer` → null forbidden → 403; null not found → 404.
  - Si `session.role !== 'admin' && input.internalNote === true` → 403.
  - Validar body → 422.
  - `sender = session.role === 'admin' ? 'admin' : 'author'`.
  - `addMessage(...)`.
  - 201.
- [ ] **T7** Tests:
  - [ ] `tests/unit/validators/tickets.test.ts` (extender) — `ticketMessageCreateSchema`: body 1..5000 OK; 5001 falla; vacío falla; internalNote opcional.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `listMessages(true)` incluye internalNote=true; `listMessages(false)` los excluye; `getTicketForViewer` autor no-admin filtra mensajes internos; `getTicketForViewer` admin los incluye.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `addMessage` con `sender='admin'` OK; `sender='author'` OK; orden cronológico estable.
  - [ ] `tests/integration/tickets/messages.test.ts` — POST mensaje autor → 201; POST internalNote=true por autor → 403; POST internalNote=true por admin → 201; GET autor no ve internalNote; GET admin ve todos; body 5001 → 422; sin sesión → 401; GET por otro user → 403; orden cronológico ASC correcto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: quitar el filtro `internal_note = 0` en `listMessages(isAdmin=false)` → test "GET autor no ve internalNote" cae → restaurar
- [ ] Sabotaje 2: olvidar chequear `session.role !== 'admin' && input.internalNote === true` → test "POST internalNote=true por autor → 403" cae → restaurar
- [ ] Sabotaje 3: invertir el orden `ASC` por `DESC` en `listMessages` → test "orden cronológico ASC" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets.ts` (rama messages + getTicketForViewer)
- [ ] Type check verde
- [ ] Commit `feat: hilo de mensajes con notas internas filtradas por rol` y push
