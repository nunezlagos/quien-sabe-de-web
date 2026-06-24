# HU-17.6 — Template de recibo de donación

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.6-template-donacion`

## Tareas tecnicas

- [ ] **T1** Helper `formatClp(amount: number): string` en `src/lib/utils/currency.ts` usando `Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 })` con fallback que añade sufijo "CLP" si el formatter no lo incluye. Tests unitarios cubren 0, positivos, millones.
- [ ] **T2** `donation_receipt.html.ts` y `donation_receipt.txt.ts` con `render(vars)`. Vars: `{ name, amount, donationId, date, receiptUrl }`. HTML escapa `name`. El template ya no formatea el monto; recibe `formattedAmount` en vars (pre-calculado por el caller con `formatClp`).
- [ ] **T3** Validador `donationReceiptVarsSchema` en `src/lib/validators/email-templates.ts` con Zod (amount int positive, donationId regex).
- [ ] **T4** Registrar en `src/lib/services/email/templates/index.ts`.
- [ ] **T5** Integrar en REQ-14: localizar el hook de "donación aprobada" y agregar `EmailService.send({ template:'donation_receipt', ... })` con `if (donation.payerEmail)` guard.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/currency.test.ts` — `formatClp(5000)` contiene `5.000`; `formatClp(0)` retorna string que NO es vacío; `formatClp(1_000_000)` contiene `1.000.000`; tipos.
  - [ ] `tests/unit/email/templates/donation-receipt.test.ts` — render normal con `formattedAmount: '$5.000 CLP'` aparece en body; varsSchema rechaza `amount: -1`; rechaza `amount: 100.5` (decimal); rechaza `donationId: 'invalid'`.
  - [ ] `tests/integration/email/donation-receipt.test.ts` — donación con `payerEmail` → 1 send; donación sin `payerEmail` → 0 sends + log warning; el `vars.amount` que llega al adapter es el número original y `formattedAmount` el string formateado.
- [ ] **T7** Verificar manualmente con Mailpit: simular donación aprobada vía seed/script, revisar email, confirmar formato del monto.

## Sabotajes a confirmar

1. En `currency.ts`, usar `'en-US'` en vez de `'es-CL'` → `formatClp(5000)` retorna `"$5,000"` con coma; test que aserta presencia de `5.000` falla → restaurar.
2. En `donation_receipt.html.ts`, olvidar escapar `name` → test unitario con `name="<script>..."` y assert de escape falla → restaurar.
3. En el hook de REQ-14, no implementar el guard `if (donation.payerEmail)` → test integración con donación anónima espera 0 sends y recibe 1 → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/utils/currency.test.ts tests/unit/email/templates/donation-receipt.test.ts tests/integration/email/donation-receipt.test.ts` → verde
- [ ] Sabotaje 1 confirmado: locale mal → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin escape → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: sin guard → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/currency.ts` y los 2 archivos de template
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: template donation_receipt + formatClp` y push a rama (no merge a main)
