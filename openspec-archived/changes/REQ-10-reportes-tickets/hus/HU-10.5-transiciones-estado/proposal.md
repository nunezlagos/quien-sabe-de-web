# Propuesta — HU-10.5 — Transiciones de estado de ticket con auditoría

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

Los tickets avanzan por un flujo: `abierto → en_revision → cerrado`. Las transiciones inválidas (e.g. `cerrado → abierto`) deben rechazarse explícitamente. Cada transición queda registrada en `admin_audit_log` (REQ-13). Cuando se transiciona a `cerrado`, se dispara el email `ticket_closed` al solicitante (HU-10.7). Esta HU introduce la máquina de estados como helper puro testeable.

## Mockups de referencia

- `mockups/dashboard-admin.html:255-260` — patrón de acciones (aprobar/rechazar) en fila de tabla admin. La transición se invoca desde botones en la fila del ticket.

## Alternativas consideradas

### Opcion A — Helper puro `nextTicketStatus(currentStatus, targetStatus)` + endpoint PATCH
- `canTransition(current, target): { ok: true } | { ok: false, reason: string }`.
- Endpoint PATCH llama al helper, ejecuta UPDATE + audit + email si corresponde.
- Pro: la lógica de transiciones es testeable sin DB.
- Pro: agregar nuevas reglas (e.g. `en_revision → en_revision` self) es un cambio unitario.
- Contra: si en el futuro se quiere máquina más compleja con guards, se migra a `xstate`; fuera de scope.

### Opcion B — Toda la lógica en el endpoint
- Pro: menos archivos.
- Contra: no testeable puro; cualquier cambio de regla toca el endpoint.

### Opcion C — Permitir transiciones libres
- Pro: máxima flexibilidad.
- Contra: rompe el flujo; el SLA se vuelve opaco.

## Decision

Se elige **Opcion A**. La máquina de estados es simple (`abierto → en_revision → cerrado`) y se testea con casos puros. La transición a `cerrado` dispara el email vía HU-10.7.

## Riesgos y mitigaciones

- Riesgo: transición a `cerrado` no envía email → Mitigación: el helper retorna `{ ok, sideEffects: ['email_closed'] }`; el endpoint ejecuta los side effects explícitamente.
- Riesgo: dos admins transicionan el mismo ticket simultáneamente → Mitigación: usar `UPDATE ... WHERE status = :currentStatus` (compare-and-set); si `rowsAffected === 0` → 409 con mensaje "estado cambió, refresca".
- Riesgo: audit log falla y el UPDATE queda commiteado → Mitigación: transacción.
- Riesgo: el admin intenta transicionar un ticket que él no debería (e.g. `kind=consulta` ya cerrado) → Mitigación: cualquier admin puede transicionar; no hay ownership de ticket en MVP.

## Metrica de exito

- Transición `abierto → en_revision` → 200 + fila en `admin_audit_log` con `event='ticket_transition'`.
- Transición `en_revision → cerrado` → 200 + fila en `admin_audit_log` + email enviado (verificable con Mailpit mock).
- Transición `cerrado → abierto` → 409 con `error: "transición inválida"`.
- Transición con `targetStatus` fuera de enum → 422.
- Transición concurrente (otro admin cambió primero) → 409 con `error: "estado cambió, refresca"`.
- Sin sesión admin → 401.
