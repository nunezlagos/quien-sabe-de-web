# HU-14.7 — Donación recurrente mensual MP

**Estado:** planned → ready
**Prioridad:** P2
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.7-donacion-recurrente`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_donation_subscriptions.sql`: CREATE TABLE + ALTER TABLE donations ADD COLUMN subscription_id.
- [ ] **T2** Schema Drizzle `donationSubscriptions` + actualización de `donations` con `subscriptionId`.
- [ ] **T3** Schema Zod `recurringCheckoutSchema` en `src/lib/validators/donations.ts`.
- [ ] **T4** Cliente MP `createMPSubscription` y `cancelMPSubscription` en `src/lib/services/payments/mercadopago.ts`.
- [ ] **T5** Servicio `createRecurringCheckout` en `src/lib/services/donations/recurring.ts` (extiende el checkout base).
- [ ] **T6** Servicio `cancelSubscription` con ownership check (`userId === session.user.id`).
- [ ] **T7** Extender `handleMPWebhook` (HU-14.3) para reconocer `subscription_authorized`, `subscription_payment`, `subscription_cancelled`.
- [ ] **T8** Endpoint `src/pages/api/v1/donations/subscriptions/[id].ts` (`DELETE`).
- [ ] **T9** Modificar `AmountSelector.astro` (HU-14.1) con toggle "Mensual".
- [ ] **T10] Modificar `PaymentButtons.astro` (HU-14.1) para que con `recurring=true` pase flag al endpoint.
- [ ] **T11] Componente `RecurringBadge.astro` + integración en dashboard-user (HU-11.3).
- [ ] **T12] Tests:
  - [ ] `tests/unit/donations/recurring-schema.test.ts` — provider=webpay + recurring rechaza.
  - [ ] `tests/unit/payments/mp-subscription.test.ts` — mock preapproval OK + cancel.
  - [ ] `tests/integration/donations/recurring-create.test.ts` — sub creada + donation pending.
  - [ ] `tests/integration/donations/recurring-webhook-payment.test.ts` — subscription_payment → INSERT donation.
  - [ ] `tests/integration/donations/recurring-cancel.test.ts` — DELETE OK; ownership 403; sin sesión 401.
  - [ ] `tests/integration/donations/recurring-rbac.test.ts` — sin sesión DELETE 401.
  - [ ] `tests/e2e/donate-recurring.spec.ts` — inicia → 2 cobros → 1 sub + 2 donations; cancela.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-recurring.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar el ownership check en `cancelSubscription` → test "usuario distinto → 403" cae en rojo → restaurar
  - [ ] Sabotaje 2: en el webhook, omitir el INSERT de nueva donation en `subscription_payment` → test "2 cobros → 2 donations" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar `provider: z.literal('mercadopago')` del schema recurring → test "webpay + recurring rechaza" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/donations/recurring.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
