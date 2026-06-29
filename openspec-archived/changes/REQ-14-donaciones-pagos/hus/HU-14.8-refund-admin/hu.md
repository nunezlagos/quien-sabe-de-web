# HU-14.8 — Reembolso admin con motivo

**Estado:** planificada | **Prioridad:** P2 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** admin
**Quiero** reembolsar una donación con motivo
**Para** manejar disputas o errores

## Criterios de aceptación (Gherkin)

### Escenario: Reembolso total exitoso
  Cuando admin envía `POST /api/v1/admin/donations/<id>/refund` con `{"reason":"error donante"}`
  Entonces se invoca refund en pasarela
  Y `donations.status="refunded"`
  Y se audita

### Escenario: Reembolso de donación ya reembolsada → 409
  Cuando intento refund de una ya refunded
  Entonces recibo 409

### Escenario: Motivo vacío → 422
  Cuando envío `reason=""`
  Entonces recibo 422

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/donations/[id]/refund.ts`
- [ ] Integración con MP/Webpay refund APIs
- [ ] Tests `tests/integration/admin/donations-refund.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
