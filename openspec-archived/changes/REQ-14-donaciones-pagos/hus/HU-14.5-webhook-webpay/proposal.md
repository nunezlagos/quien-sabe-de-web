# Propuesta — HU-14.5 — Confirmación Webpay idempotente

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

Webpay (Transbank) confirma el pago via dos mecanismos: (1) commit del lado del usuario cuando vuelve a `/donate/success?token_ws=...` — Transbank redirige con `TBK_TOKEN` si el pago fue OK; (2) el webhook `/api/v1/donations/webhook/webpay` que Transbank llama en background. Esta HU implementa la confirmación idempotente: cualquier llamada (commit del usuario o webhook) con el mismo token produce una sola transición de `pending` a `approved`. Reutiliza la tabla `webhook_events_processed` de HU-14.3 con `provider='webpay'`.

## Mockups de referencia

No aplica.

## Alternativas considered

### Opcion A — Endpoint `POST /api/v1/donations/webhook/webpay` + reuso de `webhook_events_processed`
- Endpoint público que recibe `{ token_ws }` desde Transbank o desde la vista success.
- Pro: idempotencia via tabla `processed` (PK compuesta).
- Pro: misma forma que HU-14.3 → código compartido.
- Contra: requiere validar token con Transbank (no sólo confiar en el body).

### Opcion B — Sólo confiar en el redirect del usuario (sin webhook)
- Pro: más simple.
- Contra: si el usuario cierra el browser antes del redirect, la donación queda pending; HU-14.5 debe ser robusta a "usuario completó pero no redirigió".

### Opcion C — Webhook + estado en KV
- Pro: rápido.
- Contra: inconsistencia eventual.

## Decision

Se elige **Opcion A**. Endpoint público verifica el token llamando a `WebpayPlus.Transaction.commitTransaction(token)` contra Transbank. Sólo si Transbank confirma `status='AUTHORIZED'` (o `status='SUCCESS'` según versión), se marca `donations.status='approved'` y se inserta fila en `webhook_events_processed` con PK compuesta. Si ya está procesado, 200 no-op.

## Riesgos y mitigaciones

- Riesgo: Transbank tarda en confirmar → webhook llega después del redirect → Mitigación: el commit del usuario en `/donate/success` espera el resultado de Transbank sincrónicamente (max 5s); si no, muestra "procesando".
- Riesgo: el token es falsificable → Mitigación: la confirmación se valida contra Transbank API, no se confía en el body.
- Riesgo: dos llamadas concurrentes (commit del usuario + webhook) → Mitigación: PK compuesta en `webhook_events_processed` + INSERT OR IGNORE; la segunda llamada es no-op.

## Metrica de exito

- POST `/api/v1/donations/webhook/webpay` con token válido y Transbank confirma → 200, `donations.status='approved'`, email encolado.
- Token inválido o Transbank rechaza → 401 sin tocar DB.
- Mismo token 2x → 200 no-op (1 sola fila en `processed`, 1 email).
- Token sin fila `donations` → 404 con log.
