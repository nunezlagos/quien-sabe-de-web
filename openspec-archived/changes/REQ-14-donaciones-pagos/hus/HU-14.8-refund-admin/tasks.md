# HU-14.8 — Reembolso admin con motivo

**Estado:** planned → ready
**Prioridad:** P2
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.8-refund-admin`

## Tareas tecnicas

- [ ] **T1** Migración aditiva `src/database/migrations/00XX_donations_refund_fields.sql`: ALTER TABLE donations ADD COLUMN refund_reason, refunded_at, refunded_by.
- [ ] **T2** Actualizar `src/database/schema.ts#donations` con las 3 columnas nuevas.
- [ ] **T3** Schema Zod `refundRequestSchema` en `src/lib/validators/admin-donations.ts`.
- [ ] **T4** Cliente MP `refundMPPayment(env, paymentId, amountClp)` en `src/lib/services/payments/mercadopago.ts`.
- [ ] **T5** Cliente Webpay `nullifyWebpayTransaction(env, buyOrder, amountClp)` en `src/lib/services/payments/webpay.ts`.
- [ ] **T6] Custom errors `NotFoundError`, `ConflictError` con `toHttpResponse()`.
- [ ] **T7** Servicio `refundDonation(env, actorId, donationId, reason)` en `src/lib/services/admin/donations-refund.ts` que orquesta pasarela + UPDATE + audit.
- [ ] **T8] Transacción: validar estado approved DENTRO del batch (evita race).
- [ ] **T9** Endpoint `src/pages/api/v1/admin/donations/[id]/refund.ts` (`POST`).
- [ ] **T10** Tests:
  - [ ] `tests/unit/admin-donations/refund-schema.test.ts` — reason vacío y >500 rechazan.
  - [ ] `tests/unit/payments/mp-refund.test.ts` — OK + error.
  - [ ] `tests/unit/payments/webpay-nullify.test.ts` — OK + error.
  - [ ] `tests/integration/admin/donations-refund-mp.test.ts` — OK + audit + refunded_by.
  - [ ] `tests/integration/admin/donations-refund-webpay.test.ts` — Webpay OK.
  - [ ] `tests/integration/admin/donations-refund-conflict.test.ts` — pending 409; refunded 409.
  - [ ] `tests/integration/admin/donations-refund-validation.test.ts` — reason vacío 422.
  - [ ] `tests/integration/admin/donations-refund-rbac.test.ts` — vecino 403; sin sesión 401.
  - [ ] `tests/integration/admin/donations-refund-gateway-error.test.ts` — MP error → 502 + SIN update.
  - [ ] `tests/e2e/admin-donations-refund.spec.ts` — sandbox end-to-end.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-donations-refund.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `logAdminAction` en `refundDonation` → test "audit log con refund_reason" cae en rojo → restaurar
  - [ ] Sabotaje 2: quitar la verificación `status !== 'approved'` antes de llamar pasarela → test "refund de pending → 409" cae en rojo → restaurar
  - [ ] Sabotaje 3: cambiar el orden (UPDATE antes de llamar pasarela) → test "MP error → 502 sin update" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/donations-refund.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
