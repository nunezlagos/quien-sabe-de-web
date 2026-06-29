# Propuesta — HU-14.6 — Email de recibo de donación

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

El donante (cuando proporcionó email) debe recibir un recibo con el monto formateado en CLP, número de transacción, fecha y mensaje de agradecimiento. El envío se dispara desde los webhooks de HU-14.3 (MP) y HU-14.5 (Webpay) sólo cuando `donations.status='approved'` y `payer_email IS NOT NULL`. La idempotencia del envío (no mandar dos veces) la garantiza la constraint de REQ-17.7 (`email_log` con dedup por `(template, recipient, entity_id)`).

## Mockups de referencia

No hay mockup del email. El template sigue el lenguaje visual del proyecto (paleta verde primary, logo QuiénSabe, footer con link a `/transparency`). El template de recibo vive en `src/lib/services/email/templates/donation_receipt.html` y se previsualiza en Mailpit durante dev.

## Alternativas considered

### Opcion A — Encolar el envío via `EmailService.enqueue` con template `donation_receipt` y dedup por `donation_id`
- REQ-17 ya tiene la constraint UNIQUE en `email_log(template, recipient, entity_id)`.
- Pro: reuso de infraestructura; el worker de email procesa la cola con retry.
- Pro: idempotencia a nivel DB.
- Contra: el webhook debe esperar a que la fila enqueue (latencia <50ms); aceptable.

### Opcion B — Envío sincrónico desde el webhook via SES directo
- Pro: latencia cero visible al usuario.
- Contra: si SES falla, el webhook puede timeoutear; complica retry logic.

### Opcion C — Email diario agrupado en lugar de inmediato
- Pro: menor costo SES.
- Contra: el donante quiere recibo inmediato; agrupar da mala UX.

## Decision

Se elige **Opcion A**. El webhook llama `EmailService.enqueue('donation_receipt', { donationId, amountClp, provider }, payerEmail)`. REQ-17.7 garantiza dedup vía UNIQUE constraint. Si el template no existe o falla la renderización, se loguea warning y el webhook sigue (200 OK al cliente MP/Webpay) — la donación queda confirmada aunque el email falle.

## Riesgos y mitigaciones

- Riesgo: el template tiene errores de renderización → Mitigación: tests E2E con Mailpit capturan el HTML y verifican placeholders sustituidos.
- Riesgo: el email rebota y el donante nunca lo recibe → Mitigación: SES maneja bounces; el sistema los trackea (REQ-17 fuera de scope). Aceptable para v1.
- Riesgo: el `email_log` crece mucho si no se archiva → Mitigación: archivado mensual (REQ-18, fuera de scope).

## Metrica de exito

- Webhook MP approved con `payer_email='j@x.cl'` → fila en `email_log` con `template='donation_receipt'`.
- Email es visible en Mailpit con monto en CLP formateado (`$5.000`).
- Webhook approved SIN `payer_email` → NO se encola email, se loguea "skip: anonymous donation".
- Donación ya con email enviado (re-trigger) → dedup via UNIQUE constraint, NO duplica.
- E2E: webhook simulado → Mailpit recibe 1 email.
