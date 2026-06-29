# HU-14.5 — Confirmación Webpay idempotente

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.5-webhook-webpay`

## Tareas tecnicas

- [ ] **T1** Schema Zod `webpayWebhookPayloadSchema` en `src/lib/validators/donations-webhook.ts`.
- [ ] **T2** Cliente Webpay `commitWebpayTransaction(env, token)` en `src/lib/services/payments/webpay.ts`.
- [ ] **T3** Servicio `handleWebpayWebhook(env, token)` en `src/lib/services/donations/webhook-webpay.ts`.
- [ ] **T4** Transacción batch: INSERT OR IGNORE processed + UPDATE donations en `db.batch([...])`.
- [ ] **T5** Endpoint `src/pages/api/v1/donations/webhook/webpay.ts` (`POST`) — público, llama al servicio.
- [ ] **T6** Modificar vista `/donate/success.astro` (de HU-14.4) para que tras el redirect con `token_ws`, internamente llame al endpoint o consulte Transbank para mostrar "Aprobado" / "Rechazado" en pantalla.
- [ ] **T7** Mock Transbank para tests: `tests/mocks/webpay.ts` extendido con `commitTransaction`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/donations/webpay-webhook-schema.test.ts` — token_ws faltante, formato.
  - [ ] `tests/unit/payments/webpay-commit.test.ts` — AUTHORIZED, REJECTED, SDK error.
  - [ ] `tests/integration/donations/webhook-webpay-approved.test.ts` — UPDATE + processed + email.
  - [ ] `tests/integration/donations/webhook-webpay-duplicate.test.ts` — 2x mismo token → 1 processed + 1 email.
  - [ ] `tests/integration/donations/webhook-webpay-rejected.test.ts` — REJECTED → donations.rejected + SIN email.
  - [ ] `tests/integration/donations/webhook-webpay-no-donation.test.ts` — token sin match → 404.
  - [ ] `tests/integration/donations/webhook-webpay-transbank-error.test.ts` — Transbank error → 401.
  - [ ] `tests/e2e/donate-webpay-confirm.spec.ts` — sandbox end-to-end.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-webpay-confirm.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `INSERT OR IGNORE` en processed → test "duplicate → 1 fila" cae en rojo → restaurar
  - [ ] Sabotaje 2: omitir la llamada a `commitWebpayTransaction` y confiar en el body → test "token inválido → 401" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar el `WHERE status='pending'` del UPDATE → test "doble APPROVED → segundo no actualiza" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/donations/webhook-webpay.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
