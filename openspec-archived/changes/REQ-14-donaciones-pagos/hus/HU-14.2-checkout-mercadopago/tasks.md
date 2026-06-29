# HU-14.2 — Checkout Mercado Pago

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.2-checkout-mercadopago`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_donations.sql` con tabla `donations` + 3 índices + CHECK `amount_clp >= 1000`.
- [ ] **T2** Schema Drizzle `donations` en `src/database/schema.ts`.
- [ ] **T3** Constantes `MIN_DONATION_CLP`, `MAX_DONATION_CLP` en `src/lib/constants/donations.ts`.
- [ ] **T4** Schemas Zod `checkoutRequestSchema`, `donationProviderSchema` en `src/lib/validators/donations.ts`.
- [ ] **T5** Cliente MP en `src/lib/services/payments/mercadopago.ts` con `createMPCheckout(env, input)` (usa SDK `mercadopago` npm).
- [ ] **T6** Custom error `PaymentGatewayError` con `toHttpResponse()` que mapea a 502.
- [ ] **T7** Servicio `createDonationCheckout(env, input)` en `src/lib/services/donations/checkout.ts` que orquesta MP client + INSERT.
- [ ] **T8** Si MP devuelve OK → INSERT en `donations` con `status='pending'`; si MP falla → NO INSERT, throw.
- [ ] **T9** Endpoint `src/pages/api/v1/donations/checkout.ts` (`POST`) — público, llama al servicio.
- [ ] **T10** Mock MP para tests: `tests/mocks/mercadopago.ts` que simula respuestas OK y 500.
- [ ] **T11** Tests:
  - [ ] `tests/unit/donations/checkout-schema.test.ts` — 4 casos (monto bajo, provider inválido, payer_email vacío, recurring).
  - [ ] `tests/unit/payments/mp-client.test.ts` — mock SDK: OK → mapea; SDK throws → PaymentGatewayError.
  - [ ] `tests/integration/donations/checkout-mp.test.ts` — MP 201 → fila pending + response 201; MP 500 → 502 + SIN fila; sin payer_email → null en DB.
  - [ ] `tests/integration/donations/checkout-fk.test.ts` — user_id de sesión válido; user_id null (anónimo).
  - [ ] `tests/e2e/donate-checkout-mp.spec.ts` — landing → click MP → POST → redirect a init_point.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-checkout-mp.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: cambiar el orden (INSERT antes de llamar a MP) → test "MP 500 → 502 sin fila" cae en rojo → restaurar
  - [ ] Sabotaje 2: quitar el `amount_clp >= 1000` del CHECK → test "monto 500 → 422" cae en rojo (422 viene del Zod, pero DB lo aceptaría) → restaurar
  - [ ] Sabotaje 3: hardcodear `payer_email = 'x@x.cl'` ignorando el input → test "anónimo sin payer_email → null en DB" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/donations/checkout.ts` y `src/lib/services/payments/mercadopago.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
