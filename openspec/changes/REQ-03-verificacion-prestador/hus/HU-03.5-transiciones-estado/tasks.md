# HU-03.5 — Aprobar / rechazar con auditoría y email

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.5-transiciones-estado`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `adminAuditLog` a `src/database/schema.ts` con índices y FK RESTRICT a `users`.
- [ ] **T2** Migración `src/database/migrations/0009_admin_audit_log.sql`.
- [ ] **T3** `src/lib/services/verification/stateMachine.ts` con `VERIFICATION_STATES`, `canTransition(from, to)`.
- [ ] **T4** `src/lib/services/admin/audit.ts` con `recordAudit(db, actorId, action, entityType, entityId, before, after)`.
- [ ] **T5** Extender `src/lib/services/admin/verifications.ts` con `transitionVerification(env, db, actorId, verificationId, body)`.
- [ ] **T6** Zod schema `TransitionVerificationBody` (discriminated union) en `src/lib/validators/admin.ts`.
- [ ] **T7` Endpoint `src/pages/api/v1/admin/verifications/[id].ts` con `PATCH`.
- [ ] **T8` Integración con `emailService.enqueue` (interfaz de REQ-17; si no existe aún, mockear en tests con stub que captura llamadas).
- [ ] **T9` Tests:
  - [ ] `tests/unit/verification/state-machine.test.ts` — tabla de `canTransition` cubriendo todas las combinaciones de los 3 estados.
  - [ ] `tests/unit/validators/admin-transition.test.ts` — Zod acepta `verificado` solo; rechaza `rechazado` sin `rejection_reason`; motivo < 10 chars rechazado.
  - [ ] `tests/integration/admin/verifications-transition.test.ts` — aprobar → 200 + audit log insertado + fila actualizada; rechazar con motivo → 200 + audit + email enqueued (mock); rechazar sin motivo → 422; aprobar ya aprobado → 409; admin sin permisos → 403.

## Sabotaje obligatorio

- [ ] **Sabotaje 1`: en `stateMachine.ts`, eliminar `verificado: []` y poner `verificado: ['pendiente']` (re-abrir verificación cerrada) → test "Aprobar ya aprobado → 409" debe detectar que la transición se permite → restaurar.
- [ ] **Sabotaje 2`: en `transitionVerification`, omitir el `recordAudit` (comentar la línea) → test "aprobar → audit log insertado" debe detectar que no se insertó el row → restaurar.
- [ ] **Sabotaje 3`: quitar el `min(10)` del Zod `rejection_reason` → test "rechazo sin motivo o motivo corto → 422" debe detectar que se acepta motivo de 5 chars → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/verification/stateMachine.ts` y `src/lib/services/admin/verifications.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.5-transiciones-estado` (no merge a main sin review)
