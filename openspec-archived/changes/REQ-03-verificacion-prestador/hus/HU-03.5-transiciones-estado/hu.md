# HU-03.5 — Aprobar / rechazar con auditoría y email

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** admin
**Quiero** transicionar el estado de una verificación
**Para** habilitar o bloquear al prestador con trazabilidad

## Criterios de aceptación (Gherkin)

### Escenario: Aprobar verificación pendiente
  Dado una verificación en `pendiente` con id=42
  Cuando envío `PATCH /api/v1/admin/verifications/42` con `{"status":"verificado"}`
  Entonces recibo status 200
  Y la fila queda con `status="verificado"`, `reviewed_by=<admin_id>` y `reviewed_at` no nulo
  Y se encola un email con template `verification_approved` para el prestador

### Escenario: Rechazar con motivo
  Cuando envío `PATCH /api/v1/admin/verifications/42` con `{"status":"rechazado", "rejection_reason":"documento ilegible"}`
  Entonces la fila tiene `status="rechazado"` y `rejection_reason="documento ilegible"`
  Y se envía email `verification_rejected` con el motivo

### Escenario: Transición desde estado final es inválida
  Dado una verificación ya `verificado`
  Cuando intento aprobarla de nuevo
  Entonces recibo status 409 con `{ "error": "transición inválida" }`

### Escenario: Rechazo sin motivo → 422
  Cuando envío `{"status":"rechazado"}` sin `rejection_reason`
  Entonces recibo status 422

## Tareas técnicas

- [ ] Máquina de estados en `src/lib/services/verification/stateMachine.ts`
- [ ] Endpoint `src/pages/api/v1/admin/verifications/[id].ts`
- [ ] Integración con `EmailService` (REQ-17) en templates `verification_approved` y `verification_rejected`
- [ ] Auditoría: inserta en `admin_audit_log` cada transición
- [ ] Tests `tests/unit/verification/state-machine.test.ts`, `tests/integration/admin/verifications-transition.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
