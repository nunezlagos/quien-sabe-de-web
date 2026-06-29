# HU-14.3 — Webhook Mercado Pago idempotente

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** Mercado Pago
**Quiero** notificar al sistema el resultado del pago
**Para** confirmar donaciones automáticamente

## Criterios de aceptación (Gherkin)

### Escenario: Webhook con HMAC válido confirma donación
  Dado una donación pending con external_id="MP-123"
  Cuando MP envía `POST /api/v1/donations/webhook/mercadopago` con notificación válida y HMAC correcto
  Entonces recibo status 200
  Y `donations.status="approved"`
  Y se encola email recibo

### Escenario: HMAC inválido → 401
  Cuando llega webhook con firma inválida
  Entonces recibo status 401
  Y NO se procesa

### Escenario: Webhook duplicado es idempotente
  Dado un webhook ya procesado para external_id="MP-123"
  Cuando llega el mismo payload
  Entonces recibo status 200 sin duplicar registro ni email

### Escenario: Status rejected actualiza la fila
  Cuando MP notifica `status="rejected"`
  Entonces `donations.status="rejected"` y NO se envía recibo

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/donations/webhook/mercadopago.ts`
- [ ] Verificador HMAC en `src/lib/services/payments/mp-hmac.ts`
- [ ] Tabla `webhook_events_processed (external_id, provider PK)` para idempotencia
- [ ] Tests `tests/unit/payments/mp-hmac.test.ts`, `tests/integration/donations/webhook-mp.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
