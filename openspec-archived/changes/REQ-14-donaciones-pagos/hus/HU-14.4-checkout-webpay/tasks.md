# HU-14.4 — Checkout Webpay (Transbank)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.4-checkout-webpay`

## Tareas tecnicas

- [ ] **T1** Schema Zod `webpayInitRequestSchema` en `src/lib/validators/donations.ts`.
- [ ] **T2** Cliente Webpay en `src/lib/services/payments/webpay.ts` con `initWebpayTransaction(env, input)` (usa SDK `transbank-sdk` o fetch directo si SDK no compatible con Workers).
- [ ] **T3** Servicio `createWebpayCheckout(env, input, userId)` en `src/lib/services/donations/checkout.ts` extendido.
- [ ] **T4** INSERT en `donations` con `provider='webpay'`, `status='pending'`, `external_id=<token>`.
- [ ] **T5** Endpoint `src/pages/api/v1/donations/webpay/init.ts` (`POST`) — público.
- [ ] **T6** Vista `src/pages/donate/success.astro` que muestra estado de la donación leyendo `donations` por `external_id` (token). Si pending → polling cada 2s hasta 30s, luego mensaje "estamos procesando, te avisaremos por email".
- [ ] **T7** Modificar `PaymentButtons.astro` (HU-14.1) para que el botón Webpay genere form auto-submit con `action=<form_url>` + hidden `token_ws`.
- [ ] **T8** Mock Transbank para tests: `tests/mocks/webpay.ts` con respuestas OK y error.
- [ ] **T9** Tests:
  - [ ] `tests/unit/donations/webpay-init-schema.test.ts` — monto bajo rechaza; payer_email OK.
  - [ ] `tests/unit/payments/webpay-client.test.ts` — mock SDK OK + error path.
  - [ ] `tests/integration/donations/webpay-init.test.ts` — Transbank OK → fila pending; Transbank error → 502 sin fila.
  - [ ] `tests/e2e/donate-webpay-init.spec.ts` — click Webpay → form auto-submit simulado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-webpay-init.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: cambiar el orden (INSERT antes de llamar a Webpay) → test "Webpay 500 → 502 sin fila" cae en rojo → restaurar
  - [ ] Sabotaje 2: cambiar `provider='webpay'` por `'mercadopago'` en el INSERT → test "filas webpay tienen provider=webpay" cae en rojo → restaurar
  - [ ] Sabotaje 3: comentar la generación del form auto-submit en `PaymentButtons` → test E2E "click Webpay submitea form" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/payments/webpay.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
