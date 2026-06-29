# HU-10.5 — Transiciones de estado de ticket con auditoría

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.5-transiciones-estado`

## Tareas técnicas

- [ ] **T1** Helper puro `src/lib/services/tickets/state-machine.ts`:
  - `validateTransition(current, target): { ok: true, sideEffects: string[] } | { ok: false, reason: string }`.
  - Mapa:
    - `abierto → en_revision`: ok, [].
    - `en_revision → cerrado`: ok, ['email_closed'].
    - else: !ok, `reason='transición inválida'`.
- [ ] **T2** Validador `ticketTransitionSchema` en `src/lib/validators/tickets.ts` con refine.
- [ ] **T3** Servicio `transitionTicket(env, ticketId, fromStatus, toStatus, adminId, assigneeAdminId?): Promise<Ticket>`:
  - `UPDATE tickets SET status = ?, assignee_admin_id = COALESCE(?, assignee_admin_id) WHERE id = ? AND status = ?`.
  - Si `rowsAffected === 0` → `throw new ConcurrentTransitionError()`.
  - `recordAdminAudit(adminId, 'ticket_transition', 'ticket', ticketId, JSON.stringify({from, to}))`.
  - Retornar fila actualizada.
- [ ] **T4** Servicio `assignTicket(env, ticketId, adminId, assigneeAdminId): Promise<Ticket>` (caso sin cambio de status).
- [ ] **T5** Endpoint `src/pages/api/v1/admin/tickets/[id].ts` (PATCH):
  - `requireAdmin(Astro)` → 401 / 403.
  - Validar body con `ticketTransitionSchema` → 422.
  - `getTicketById` → 404 si null.
  - Si `input.status !== undefined`:
    - `validateTransition(current.status, input.status)`. Si `!ok` → 409.
  - `transitionTicket` o `assignTicket` según qué cambió.
  - Si sideEffects.includes('email_closed') → `EmailService.send('ticket_closed', ...)`. Try/catch; warning.
  - `successResponse(updatedTicket, 200)`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/tickets/state-machine.test.ts` — `abierto→en_revision` ok; `en_revision→cerrado` ok+sideEffects; `cerrado→abierto` !ok; `abierto→cerrado` !ok; `en_revision→en_revision` !ok.
  - [ ] `tests/unit/validators/tickets.test.ts` (extender) — `{}` falla; `{ status: 'abierto' }` OK; `{ status: 'otro' }` falla.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `transitionTicket` happy path; simular `rowsAffected=0` → `ConcurrentTransitionError`.
  - [ ] `tests/integration/admin/tickets-transition.test.ts` — `abierto→en_revision` 200 + audit; `en_revision→cerrado` 200 + audit + email mock; `cerrado→abierto` 409; transición concurrente (UPDATE rowsAffected=0) 409; sin sesión 401; sesión vecino 403; ticket inexistente 404; status inválido 422.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `validateTransition`, permitir `cerrado → abierto` (quitar la regla) → test "cerrado → abierto !ok" cae → restaurar
- [ ] Sabotaje 2: olvidar el `WHERE status = :currentStatus` en el UPDATE → test "transición concurrente 409" cae (rowsAffected=1 incluso si cambió) → restaurar
- [ ] Sabotaje 3: no incluir `email_closed` en sideEffects de `en_revision → cerrado` → test "transición a cerrado dispara email" cae (EmailService.send no se llama) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets/state-machine.ts` y `src/lib/services/tickets.ts` (rama transition)
- [ ] Type check verde
- [ ] Commit `feat: transiciones de estado de ticket con auditoría y email` y push
