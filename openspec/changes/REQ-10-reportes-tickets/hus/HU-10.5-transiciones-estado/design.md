# Diseno tecnico — HU-10.5 — Transiciones de estado de ticket con auditoría

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

UPDATE sobre `tickets` (HU-10.1) + INSERT en `admin_audit_log` + (opcional) email.

UPDATE con compare-and-set:

```sql
UPDATE tickets
SET status = :targetStatus,
    assignee_admin_id = COALESCE(:assigneeAdminId, assignee_admin_id)
WHERE id = :id AND status = :currentStatus;
```

Si `rowsAffected === 0` → el estado cambió entre el SELECT inicial y el UPDATE; devolver 409.

Audit:

```sql
INSERT INTO admin_audit_log (actor_id, event, target_kind, target_id, reason, created_at)
VALUES (:adminId, 'ticket_transition', 'ticket', :ticketId,
        :jsonPayload, :nowSec);
```

Donde `jsonPayload` codifica `{"from": "...", "to": "..."}` para reconstruir la transición.

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 200 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/admin/tickets/:id` | PATCH | sesión admin | `id` numérico | `{ status?: 'abierto'\|'en_revision'\|'cerrado', assigneeAdminId?: number\|null }` | `{ id, status, assigneeAdminId }` | 401, 403, 404, 409 (transición inválida o estado cambió), 422 (Zod) |

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (extender)
export const ticketTransitionSchema = z.object({
  status: ticketStatusSchema.optional(),
  assigneeAdminId: z.number().int().positive().nullable().optional(),
}).refine(
  (v) => v.status !== undefined || v.assigneeAdminId !== undefined,
  { message: 'debe incluir status o assigneeAdminId' }
);
```

## Componentes UI

No aplica. La UI de transición se materializa como botones en la fila del ticket (HU-10.4 cola admin) o en vista detalle (HU futura). Esta HU es sólo el endpoint.

## Flujo de interaccion (secuencial)

1. Admin envía `PATCH /api/v1/admin/tickets/<id>` con `{ status?, assigneeAdminId? }`.
2. Handler en `src/pages/api/v1/admin/tickets/[id].ts`:
   a. `requireAdmin(Astro)` → 401 / 403.
   b. Validar body con `ticketTransitionSchema` → 422.
   c. `getTicketById` → 404 si null.
   d. Si `input.status !== undefined`:
      - `validateTransition(currentStatus, targetStatus)`:
        - `abierto → en_revision`: OK.
        - `en_revision → cerrado`: OK, sideEffects = ['email_closed'].
        - Else: `{ ok: false, reason: 'invalid transition' }`.
      - Si `!ok` → 409 `{ error: reason }`.
   e. Transacción:
      - UPDATE con compare-and-set (`WHERE status = currentStatus`).
      - Si `rowsAffected === 0` → 409 `{ error: 'estado cambió, refresca' }`.
      - INSERT audit log.
   f. Si sideEffects incluye `email_closed` → invocar `EmailService.send('ticket_closed', ...)` (HU-10.7). Try/catch; warning si falla.
   g. `successResponse(updatedTicket, 200)`.

## Capa de servicios

- `src/lib/services/tickets/state-machine.ts` (puro):
  - `validateTransition(current, target): { ok: true, sideEffects: string[] } | { ok: false, reason: string }`.
- `src/lib/services/tickets.ts` (extender):
  - `transitionTicket(env, ticketId, fromStatus, toStatus, adminId, assigneeAdminId?): Promise<Ticket>` — compare-and-set + audit.
  - `assignTicket(env, ticketId, adminId, assigneeAdminId): Promise<Ticket>` — UPDATE `assignee_admin_id`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/tickets/state-machine.test.ts` | `abierto → en_revision`: OK; `en_revision → cerrado`: OK + sideEffects; `cerrado → abierto`: !ok; `abierto → cerrado`: !ok (debe pasar por en_revision); `en_revision → en_revision`: !ok (no self); self-loop explícito documentado como !ok |
| Unit | `tests/unit/validators/tickets.test.ts` (extender) | `ticketTransitionSchema`: `{}` falla; `{ status: 'abierto' }` OK; `{ assigneeAdminId: 5 }` OK; `{ status: 'otro' }` falla |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | `transitionTicket` happy path; `transitionTicket` con `rowsAffected === 0` → `ConcurrentTransitionError` |
| Integración | `tests/integration/admin/tickets-transition.test.ts` | `abierto → en_revision` → 200 + audit; `en_revision → cerrado` → 200 + audit + email enviado (mock); `cerrado → abierto` → 409; transición concurrente → 409; sin sesión → 401; sesión vecino → 403; ticket inexistente → 404; status inválido → 422 |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.1 (schema), HU-10.4 (admin ya tiene contexto), HU-10.7 (EmailService).
- **Bloquea a:** ninguna directa.
- **Recursos compartidos:** `recordAdminAudit` (HU-09.6), `EmailService` (REQ-17).

## Riesgos tecnicos

- Riesgo: el compare-and-set falla silenciosamente si la columna de status no se llama `status` → Mitigación: tests verifican explícitamente.
- Riesgo: la transición a `cerrado` dispara email que rebota y el ticket igual queda cerrado → Mitigación: aceptable; el admin puede reabrir manualmente si se agrega HU futura; documentar.
- Riesgo: el helper `validateTransition` se mete en `tickets.ts` y se vuelve impuro → Mitigación: archivo separado `state-machine.ts` puro.
- Riesgo: el audit log crece sin bound → Mitigación: REQ futuro de archivado tras 12 meses (fuera de scope).
