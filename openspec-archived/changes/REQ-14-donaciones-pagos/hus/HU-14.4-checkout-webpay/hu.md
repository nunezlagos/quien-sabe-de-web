# HU-14.4 — Checkout Webpay (Transbank)

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante chileno
**Quiero** donar con tarjetas locales vía Webpay
**Para** ofrecer alternativa a MP

## Criterios de aceptación (Gherkin)

### Escenario: Init Webpay con monto válido
  Cuando envío `POST /api/v1/donations/webpay/init` con `{"amount_clp":5000}`
  Entonces recibo `{ form_url, token }`
  Y existe fila `donations` con provider="webpay" y status="pending"

### Escenario: Retorno success
  Dado un token válido
  Cuando Webpay redirige a `/donate/success?token=...`
  Entonces el sistema confirma con Webpay y actualiza la donación

### Escenario: Error de inicio Webpay → 502
  Cuando Transbank devuelve error
  Entonces recibo 502

## Tareas técnicas

- [ ] Cliente `src/lib/services/payments/webpay.ts`
- [ ] Endpoint `src/pages/api/v1/donations/webpay/init.ts`
- [ ] Vista `src/pages/donate/success.astro` que cierra el flujo
- [ ] Tests `tests/integration/donations/webpay-init.test.ts`
- [ ] Actualizar `mockups/donate.html` radio de pasarela: cuando usuario elige 'Webpay', POST a `/api/v1/donations/webpay/init` (en lugar de `/api/v1/donations/checkout` para MP).

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
