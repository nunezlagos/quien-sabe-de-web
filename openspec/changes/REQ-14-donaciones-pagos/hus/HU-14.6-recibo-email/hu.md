# HU-14.6 — Email de recibo de donación

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante
**Quiero** recibir un email con el recibo de mi donación
**Para** tener constancia de la transacción

## Criterios de aceptación (Gherkin)

### Escenario: Email enviado al confirmar pago
  Dado un webhook que confirma donación id=99 con `payer_email="juan@ejemplo.cl"`
  Cuando se procesa
  Entonces `EmailService.send("donation_receipt", {...}, "juan@ejemplo.cl")` se invoca
  Y el email es visible en Mailpit con monto en CLP formateado

### Escenario: Sin payer_email no se envía
  Dado donación anónima sin email
  Cuando se confirma
  Entonces no se envía y se loguea

### Escenario: Idempotencia: no enviar dos veces
  Dado el envío ya registrado en `email_log`
  Cuando vuelve a invocarse
  Entonces no se duplica (constraint REQ-17.7)

## Tareas técnicas

- [ ] Template `donation_receipt.html` en `src/lib/services/email/templates/`
- [ ] Hook en webhook MP y Webpay
- [ ] Tests `tests/integration/donations/receipt-email.test.ts` contra Mailpit

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
