# Propuesta — HU-14.4 — Checkout Webpay (Transbank)

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

Webpay (Transbank) es la pasarela dominante para tarjetas chilenas (RUT,CuentaRUT, débito, crédito). Muchos donantes no tienen cuenta MP pero sí tarjeta de banco. Esta HU implementa el init del checkout Webpay: el usuario click "Donar con Webpay", el server llama a la API de Transbank, obtiene una URL + token, y el cliente hace POST con auto-submit a esa URL (no redirect simple). El retorno lo confirma el webhook (HU-14.5) — el init sólo crea la fila pending.

## Mockups de referencia

No hay mockup de checkout Webpay. El init retorna una URL + token; el cliente redirige via form POST auto-submit (patrón estándar de Webpay).

## Alternativas considered

### Opcion A — SDK oficial Transbank `transbank-sdk` (npm) + endpoint `init` que retorna `{ form_url, token }`
- SDK oficial maneja `initTransaction` con autenticación y firma.
- Pro: SDK oficial, sigue cambios de Transbank.
- Pro: reutilizar la misma tabla `donations` con `provider='webpay'`.
- Contra: SDK pesa; dependencias nativas posibles.

### Opcion B — Fetch directo a la API REST de Transbank
- Pro: bundle más liviano.
- Contra: re-implementar auth + firma; alto riesgo de error en producción.

### Opcion C — Tercer servicio de pagos (Khipu, Flow, Mercado Pago sólo)
- Pro: UX más moderna.
- Contra: el cliente pidió explícitamente Webpay en el REQ.

## Decision

Se elige **Opcion A**. SDK `transbank-sdk` npm. Endpoint `POST /api/v1/donations/webpay/init` que retorna `{ form_url, token }`. El cliente (HU-14.1 `PaymentButtons`) genera un form auto-submit con `action=<form_url>` y campo hidden `token_ws=<token>`.

## Riesgos y mitigaciones

- Riesgo: Transbank tiene ambiente de integración y producción con URLs distintas → Mitigación: la URL viene de la SDK según `WEBPAY_ENV` (env var de Wrangler: `integration` | `production`).
- Riesgo: el token de Transbank expira en ~10 min → Mitigación: el init debe ser cercano al submit del usuario; aceptable (UX: el form auto-submit es inmediato).
- Riesgo: la SDK puede no funcionar en Cloudflare Workers → Mitigación: verificar compatibilidad al instalar; si no, escribir cliente HTTP propio siguiendo el spec público de Transbank.

## Metrica de exito

- POST `/api/v1/donations/webpay/init` con `{"amount_clp":5000}` → 200 con `{ form_url, token, donation_id }` + fila `donations` con `provider='webpay'`, `status='pending'`.
- Webpay retorna error en init → 502 + SIN fila.
- E2E: usuario completa flujo en sandbox Transbank → donación confirmada (verificación en HU-14.5).
