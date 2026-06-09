# REQ-14-donaciones-pagos

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE3

## Descripción

Sistema de donaciones voluntarias vía Mercado Pago y Webpay. Generación de
checkout, webhooks de confirmación, recibo automático por email,
contabilización para el ratio donaciones/costos (OE3 = ≥ 80 % en mes 12).

## Criterios de éxito

- [ ] Donante anónimo o autenticado puede iniciar checkout (Mercado Pago o Webpay).
- [ ] Webhook idempotente: misma notificación 2x no duplica registro.
- [ ] Email con recibo enviado en <60 s tras confirmación.
- [ ] Ratio donaciones/costos visible en admin (REQ-13) y público (REQ-15).
- [ ] Modos: única / recurrente (mensual).
- [ ] Reembolso flow para admin con motivo.

## Superficie técnica

### Endpoints API
- `POST /api/v1/donations/checkout` — crea preferencia MP [público]
- `POST /api/v1/donations/webpay/init` — init Webpay [público]
- `POST /api/v1/donations/webhook/mercadopago` — webhook MP [público + verify HMAC]
- `POST /api/v1/donations/webhook/webpay` — webhook Webpay [público + verify token]
- `GET  /api/v1/donations/me` — historial propio [sesión]
- `POST /api/v1/admin/donations/:id/refund` — reembolso [admin]

### Vistas Astro
- `/donate` — landing con CTA + montos sugeridos
- `/donate/success`, `/donate/pending`, `/donate/failure`

### Tablas Drizzle
- `donations` (id, provider, external_id, amount_clp, status, payer_email?, recurring, created_at)

### Bindings Cloudflare
- `D1`, `SES` (recibos), `SECRET` (claves API MP/Webpay)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-14.1 | landing-donar | `/donate` con CTA + montos sugeridos | P0 |
| HU-14.2 | checkout-mercadopago | Crear preferencia + redirect | P0 |
| HU-14.3 | webhook-mercadopago | Verificar HMAC + idempotencia | P0 |
| HU-14.4 | checkout-webpay | Init + retorno | P1 |
| HU-14.5 | webhook-webpay | Confirmación + idempotencia | P1 |
| HU-14.6 | recibo-email | Template + envío post-confirmación | P0 |
| HU-14.7 | donacion-recurrente | Suscripción MP mensual | P2 |
| HU-14.8 | refund-admin | Endpoint + integración pasarela | P2 |
| HU-14.9 | metrica-ratio-OE3 | Agregado donaciones / costos | P0 |

## Tests requeridos

- **Unit:** verificadores HMAC MP / Webpay, validador de montos, normalizador de status.
- **Integración:** webhook con HMAC inválido → 401; webhook duplicado → 200 no-op; ratio calculado contra fixture de gastos.
- **E2E:** usuario inicia donación con monto sugerido → redirect a sandbox MP → webhook simulado → email recibido.

## Dependencias

- **Depende de:** REQ-01 (opcional, donaciones anónimas OK), REQ-17
- **Habilita a:** REQ-15, REQ-13 (finanzas)

## Riesgos / suposiciones

- Credenciales MP/Webpay sólo vía Wrangler secret en prod.
- Webhooks deben procesar en <30s para no expirar en MP.
- Ley 21.420 (factura electrónica): boletas/facturas se generan fuera de scope inicial; en `expenses` se registra el documento manual.
