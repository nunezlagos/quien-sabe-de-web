# Propuesta — HU-03.5 — Aprobar / rechazar con auditoría y email

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

Una vez el admin tiene la solicitud en cola (HU-03.4), debe poder aprobarla o rechazarla con un motivo. Esta HU implementa `PATCH /api/v1/admin/verifications/:id`: state machine que sólo permite transiciones `pendiente → verificado` o `pendiente → rechazado` (con `rejection_reason` obligatorio), escribe auditoría en `admin_audit_log`, y encola emails transaccionales (`verification_approved`, `verification_rejected`) usando el servicio de REQ-17. Es el último paso del flujo admin; sin esto el prestador nunca sabe el resultado.

## Mockups de referencia

- `mockups/dashboard-admin.html:257-258` — botones "Aprobar" (verde) y "Rechazar" (rojo) por fila. Esta HU define los endpoints que esos botones llaman; REQ-13 los integra con modal de motivo al rechazar.

## Alternativas consideradas

### Opcion A — State machine explícita con tabla de transiciones permitidas
- Objeto `STATE_MACHINE = { pendiente: ['verificado', 'rechazado'], verificado: [], rechazado: [] }`.
- Helper `canTransition(from, to)` consulta el mapa.
- Auditoría: insert en `admin_audit_log` con `{ actor_id, action, entity_type, entity_id, before, after, created_at }`.
- Pro: explícita, testeable, agregar nuevos estados es una entrada en el mapa.
- Pro: rechazar sin `rejection_reason` es chequeado antes de la transición.

### Opcion B — Permitir transiciones libres desde cualquier estado
- Contra: rompe invariantes; permite `verificado → pendiente`, que es ruido.

### Opcion C — Soft state con flag `archived`
- Contra: complica queries; no resuelve el problema central.

## Decision

Se elige **Opcion A**. La state machine vive en `src/lib/services/verification/stateMachine.ts` (pura, testeable). El handler del endpoint sólo orquesta: validación admin → state machine → update fila → audit log → enqueue email. La auditoría es un side-effect separado, fácil de desactivar en tests.

## Riesgos y mitigaciones

- Riesgo: el email transaccional falla y la transición queda inconsistente → Mitigación: la transición de DB es la fuente de verdad; el email enqueue es best-effort con retry (responsabilidad de REQ-17). Si el email falla, el admin ve warning en response pero la transición queda persistida.
- Riesgo: `rejection_reason` vacío por bug → Mitigación: Zod `min(10).max(500)` en el body, validado ANTES de la transición.
- Riesgo: race entre dos admins → Mitigación: la transición actualiza `WHERE id = ? AND status = 'pendiente'`; si affected rows === 0 → 409.
- Riesgo: `admin_audit_log` crece sin control → Mitigación: aceptable para MVP (volumen bajo); rotación futura.

## Metrica de exito

- PATCH `/admin/verifications/42` con `{"status":"verificado"}` por admin → 200, fila `verificado`, `reviewed_by` y `reviewed_at` poblados, entrada en `admin_audit_log`, email `verification_approved` encolado.
- PATCH con `{"status":"rechazado"}` sin `rejection_reason` → 422.
- PATCH sobre fila ya `verificado` → 409 `transición inválida`.
- PATCH por usuario no-admin → 403.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `stateMachine.ts`.
