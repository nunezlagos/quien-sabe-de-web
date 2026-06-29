# HU-17.6 — Template de recibo de donación

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** donante
**Quiero** recibir un recibo claro tras donar
**Para** tener constancia de mi aporte

## Criterios de aceptación (Gherkin)

### Escenario: Recibo enviado al confirmar donación
  Cuando una donación se aprueba
  Entonces se envía `donation_receipt` al `payer_email`

### Escenario: Recibo incluye monto en CLP formateado
  Dado monto 5000
  Cuando se renderiza
  Entonces el cuerpo muestra "$5.000 CLP"

### Escenario: Sin payer_email no se envía
  Dado donación anónima
  Cuando se confirma
  Entonces no se envía

## Tareas técnicas

- [ ] Template `donation_receipt.html.ts`
- [ ] Helper `formatClp(value)` en `src/lib/utils/currency.ts`
- [ ] Tests `tests/unit/utils/currency.test.ts`, `tests/integration/email/donation-receipt.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
