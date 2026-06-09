# HU-14.2 — Checkout Mercado Pago

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante
**Quiero** iniciar el checkout en Mercado Pago
**Para** completar la donación con MP

## Criterios de aceptación (Gherkin)

### Escenario: Crear preferencia MP con monto válido
  Cuando envío `POST /api/v1/donations/checkout` con `{"provider":"mercadopago","amount_clp":5000,"recurring":false,"payer_email":"juan@ejemplo.cl"}`
  Entonces recibo status 201 con `{ init_point, external_id, donation_id }`
  Y existe fila en `donations` con `status="pending"`

### Escenario: Monto fuera de rango → 422
  Cuando envío `amount_clp: 500`
  Entonces recibo status 422 con `{ "error": "monto mínimo 1000" }`

### Escenario: Donación anónima sin payer_email
  Cuando envío sin `payer_email`
  Entonces recibo status 201 y `payer_email=null`

### Escenario: Error MP API → 502
  Dado que MP responde 500
  Cuando se procesa
  Entonces recibo 502 con `{ "error": "error pasarela" }`
  Y NO se crea fila en `donations`

## Tareas técnicas

- [ ] Cliente `src/lib/services/payments/mercadopago.ts` con SDK / fetch
- [ ] Endpoint `src/pages/api/v1/donations/checkout.ts`
- [ ] Schema `donations` en `src/database/schema.ts`
- [ ] Tests `tests/unit/payments/mp.test.ts`, `tests/integration/donations/checkout.test.ts` con mock MP

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
