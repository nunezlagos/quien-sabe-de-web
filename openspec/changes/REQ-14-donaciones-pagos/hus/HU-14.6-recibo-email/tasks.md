# HU-14.6 — Email de recibo de donación

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.6-recibo-email`

## Tareas tecnicas

- [ ] **T1** Schema Zod `donationReceiptContextSchema` en `src/lib/validators/donation-receipt.ts`.
- [ ] **T2** Template `src/lib/services/email/templates/donation_receipt.html` con header QuiénSabe, monto formateado, número de donación, link a `/transparency`.
- [ ] **T3** Servicio `enqueueDonationReceipt(env, donation)` en `src/lib/services/email/donation-receipt.ts` con try/catch alrededor de `EmailService.enqueue`.
- [ ] **T4** Integrar llamada a `enqueueDonationReceipt` en `handleMPWebhook` (HU-14.3) tras UPDATE de donación approved.
- [ ] **T5** Integrar llamada a `enqueueDonationReceipt` en `handleWebpayWebhook` (HU-14.5) tras UPDATE de donación approved.
- [ ] **T6** Helper `formatCLP` en `src/lib/utils/format.ts` (compartido con HU-13.5).
- [ ] **T7** Tests:
  - [ ] `tests/unit/email/donation-receipt-schema.test.ts` — context válido; amount no positivo rechaza.
  - [ ] `tests/unit/email/donation-receipt-template.test.ts` — render con contexto → placeholders OK; CLP formateado.
  - [ ] `tests/integration/donations/receipt-email.test.ts` — approved con email → fila en email_log; duplicado → no duplica; template 'donation_receipt' correcto.
  - [ ] `tests/integration/donations/receipt-anonymous.test.ts` — sin payer_email → no fila, log "skip anonymous".
  - [ ] `tests/e2e/donate-receipt.spec.ts` — webhook MP end-to-end → Mailpit recibe email.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-receipt.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar la llamada a `enqueueDonationReceipt` en el webhook → test "approved con email → fila en email_log" cae en rojo → restaurar
  - [ ] Sabotaje 2: quitar el guard `if (!payerEmail) return` en `enqueueDonationReceipt` → test "anónimo → no fila, log skip" cae en rojo → restaurar
  - [ ] Sabotaje 3: invertir el orden (enqueue ANTES del UPDATE) → si webhook se interrumpe, queda email enviado pero donation sigue pending; test "transacción batch" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/email/donation-receipt.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
