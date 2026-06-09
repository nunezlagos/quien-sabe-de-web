# HU-14.5 — Confirmación Webpay idempotente

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** Webpay
**Quiero** confirmar el estado del pago
**Para** completar la donación con seguridad

## Criterios de aceptación (Gherkin)

### Escenario: Confirmación válida
  Cuando llega `POST /api/v1/donations/webhook/webpay` con token autorizado
  Entonces recibo 200 y `donations.status="approved"`

### Escenario: Token inválido → 401
  Cuando llega token no verificable
  Entonces recibo status 401

### Escenario: Duplicado idempotente
  Dado un commit ya procesado
  Cuando vuelve a llegar
  Entonces recibo 200 no-op

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/donations/webhook/webpay.ts`
- [ ] Reuso de tabla `webhook_events_processed` con provider='webpay'
- [ ] Tests `tests/integration/donations/webhook-webpay.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
