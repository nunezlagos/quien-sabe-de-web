# HU-14.3 — Webhook Mercado Pago idempotente

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.3-webhook-mercadopago`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_webhook_events_processed.sql`: CREATE TABLE con PK compuesta.
- [ ] **T2** Schema Drizzle `webhookEventsProcessed` en `src/database/schema.ts`.
- [ ] **T3** Helper `verifyMPWebhookSignature(rawBody, signatureHeader, secret)` con `timingSafeEqual` en `src/lib/services/payments/mp-hmac.ts`.
- [ ] **T4** Helper `getMPPaymentDetails(env, notificationId)` en `src/lib/services/payments/mercadopago.ts` que llama `GET /v1/notifications/<id>`.
- [ ] **T5** Schema Zod `mpWebhookPayloadSchema` en `src/lib/validators/donations-webhook.ts`.
- [ ] **T6** Servicio `handleMPWebhook(env, rawBody, signature)` en `src/lib/services/donations/webhook-mp.ts` que orquesta: HMAC verify → resolver payment → INSERT OR IGNORE processed → UPDATE donation → enqueue email si approved.
- [ ] **T7** Transacción batch: INSERT processed + UPDATE donation en `db.batch([...])`.
- [ ] **T8** Endpoint `src/pages/api/v1/donations/webhook/mercadopago.ts` (`POST`). Lee raw body con `await request.text()` antes de parsear (necesario para HMAC).
- [ ] **T9** Integración con `EmailService.enqueue('donation_receipt', {...}, payer_email)` (HU-14.6; si no está lista, dejar la línea comentada con TODO).
- [ ] **T10** Tests:
  - [ ] `tests/unit/payments/mp-hmac.test.ts` — 4 casos: HMAC válido, firma alterada, body alterado, header ausente.
  - [ ] `tests/unit/payments/mp-payload-schema.test.ts` — payload malformado, payload con data.id faltante.
  - [ ] `tests/integration/donations/webhook-mp-hmac.test.ts` — HMAC inválido → 401 + cero writes en DB.
  - [ ] `tests/integration/donations/webhook-mp-approved.test.ts` — HMAC válido + approved → UPDATE + INSERT processed + email encolado.
  - [ ] `tests/integration/donations/webhook-mp-duplicate.test.ts` — 2 llamadas mismo external_id → 200 + 1 fila processed + 1 email.
  - [ ] `tests/integration/donations/webhook-mp-rejected.test.ts` — status=rejected → donations.rejected + SIN email.
  - [ ] `tests/integration/donations/webhook-mp-no-donation.test.ts` — external_id sin match → 404.
  - [ ] `tests/e2e/donate-webhook-mp.spec.ts` — sandbox MP end-to-end.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-webhook-mp.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `INSERT OR IGNORE` en processed → test "webhook duplicado → 1 fila" cae en rojo → restaurar
  - [ ] Sabotaje 2: invertir la comparación HMAC por `===` (sin timingSafeEqual) → test "firma alterada → 401" puede pasar pero expone timing attack; agregar test explícito y restaurar
  - [ ] Sabotaje 3: comentar el `if (status === 'approved' && payerEmail)` → test "rejected sin email" cae en rojo (se envía email en rejected) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/payments/mp-hmac.ts` y `src/lib/services/donations/webhook-mp.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
