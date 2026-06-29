# HU-14.1 — Landing `/donate` con CTA y montos sugeridos

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.1-landing-donar`

## Tareas tecnicas

- [ ] **T1** Constantes `SUGGESTED_AMOUNTS_CLP`, `MIN_DONATION_CLP`, `MAX_DONATION_CLP` en `src/lib/constants/donations.ts`.
- [ ] **T2** Schemas Zod `donationAmountSchema`, `checkoutIntentSchema` en `src/lib/validators/donate-landing.ts`.
- [ ] **T3** Servicio `listEnabledProviders(env)` en `src/lib/services/donations/providers.ts` que lee env vars y retorna array de providers.
- [ ] **T4** Endpoint público `src/pages/api/v1/donations/providers.ts` (`GET`).
- [ ] **T5** Componente `AmountSelector.astro` con 4 botones + input "Otro monto" + validación inline.
- [ ] **T6** Componente `PaymentButtons.astro` con props `{ providers, amount }`, un botón por provider habilitado.
- [ ] **T7** Componente `Hero.astro` con copy "Cuentas claras, amistad larga" (alineado con `mockups/transparency.html:43`).
- [ ] **T8** Vista `src/pages/donate.astro` que carga `providers` y renderiza Hero + AmountSelector + PaymentButtons.
- [ ] **T9** Script cliente (`<script>` en la vista) que gestiona selección de monto, validación, fetch a checkout y redirect.
- [ ] **T10** Tests:
  - [ ] `tests/unit/donate-landing/amount-schema.test.ts` — 500 rechaza; 1000 ok; 5_000_001 rechaza.
  - [ ] `tests/unit/donate-landing/listEnabledProviders.test.ts` — ambos configurados; sólo MP; ninguno configurado.
  - [ ] `tests/integration/donate-landing/providers-endpoint.test.ts` — endpoint retorna el set correcto.
  - [ ] `tests/e2e/donate-landing.spec.ts` — 4 montos visibles; click MP dispara POST; monto inválido bloquea.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/donate-landing.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: cambiar `MIN_DONATION_CLP` a 100 → test E2E "monto 500 bloqueado" cae en rojo → restaurar
  - [ ] Sabotaje 2: comentar el `fetch('/api/v1/donations/checkout', ...)` → test E2E "click MP inicia checkout" cae en rojo → restaurar
  - [ ] Sabotaje 3: invertir `enabled: true` por `enabled: false` en `listEnabledProviders` cuando MP está configurado → test E2E "botón MP visible" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/donations/providers.ts` y `src/lib/validators/donate-landing.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
- [ ] **Recordatorio**: el mockup dedicado queda como TBD (se valida visualmente con el dueño del producto antes de merge a main).
