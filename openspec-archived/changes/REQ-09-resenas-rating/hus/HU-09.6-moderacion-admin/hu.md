# HU-09.6 — Moderación admin: ocultar reseña con motivo

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** admin
**Quiero** ocultar una reseña que viola las políticas
**Para** preservar la calidad de la conversación pública

## Criterios de aceptación (Gherkin)

### Escenario: Ocultar reseña con motivo
  Cuando admin envía `PATCH /api/v1/admin/reviews/<id>/hide` con `{"reason":"insultos"}`
  Entonces recibo status 200
  Y `reviews.status="hidden"`, `hidden_reason="insultos"`
  Y se inserta en `admin_audit_log` la acción

### Escenario: Reseña oculta no aparece en GET público
  Dado la reseña en `hidden`
  Cuando se lista en perfil público
  Entonces no aparece y no afecta `rating_avg`

### Escenario: Razon vacía → 422
  Cuando envío `{"reason":""}`
  Entonces recibo status 422

### Escenario: No-admin → 403
  Dado un vecino intenta ocultar
  Cuando envía el PATCH
  Entonces recibo status 403

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/reviews/[id]/hide.ts`
- [ ] Integración con `admin_audit_log` (REQ-13)
- [ ] Tests `tests/integration/admin/reviews-hide.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
