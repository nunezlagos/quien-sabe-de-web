# Propuesta — HU-14.3 — Webhook Mercado Pago idempotente

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

Mercado Pago notifica el resultado del pago via webhook (`POST /api/v1/donations/webhook/mercadopago`). Esta HU implementa ese endpoint con tres requisitos críticos: (1) verificación de HMAC para asegurar que el request viene realmente de MP; (2) idempotencia — MP puede enviar el mismo webhook 2-3 veces y no debemos duplicar la fila ni el email; (3) enqueue del email de recibo (HU-14.6). La tabla `webhook_events_processed (external_id, provider PK)` registra qué notificaciones ya se procesaron.

## Mockups de referencia

No aplica — endpoint server-only.

## Alternativas considered

### Opcion A — Tabla `webhook_events_processed (provider, external_id, processed_at)` con PK compuesta + HMAC verification
- PK compuesta garantiza unicidad. Verificación HMAC usa header `x-signature` de MP.
- Pro: idempotencia atómica (INSERT OR IGNORE antes de UPDATE donation).
- Pro: HMAC es estándar de MP.
- Contra: requiere guardar el secret de MP; ya está en Wrangler secrets.

### Opcion B — Cache KV con TTL para idempotencia
- Pro: más rápido que DB para check.
- Contra: KV tiene consistencia eventual; un INSERT y un GET simultáneos pueden dar doble procesamiento. Riesgo inaceptable.

### Opcion C — Confiar en `external_id` UNIQUE en `donations` y manejar duplicados como no-op
- Pro: zero nueva tabla.
- Contra: el flujo es UPDATE (cambiar `status`), no INSERT; el UNIQUE no impide el UPDATE doble. Necesitamos otra capa.

## Decision

Se elige **Opcion A**. Tabla `webhook_events_processed` con PK compuesta `(provider, external_id)` + INSERT OR IGNORE + verificación HMAC con SHA-256 sobre header `x-signature` de MP. Si HMAC falla → 401 sin tocar DB.

## Riesgos y mitigaciones

- Riesgo: el header de firma de MP cambia entre versiones → Mitigación: pinear versión del algoritmo (SHA-256 con secret como key); tests con fixtures de headers reales de docs MP.
- Riesgo: el webhook excede 30s y MP timeoutea → Mitigación: el procesamiento es <500ms (UPDATE + INSERT + enqueue). Encolar el email en lugar de enviarlo sincrónico (HU-14.6).
- Riesgo: la fila en `donations` no existe para el `external_id` → Mitigación: webhook sin fila matcheable → 404 con log; MP reintentará. Caso raro (race con INSERT de checkout).

## Metrica de exito

- Webhook con HMAC válido + `status=approved` → 200, `donations.status='approved'`, fila en `webhook_events_processed`, email encolado.
- Webhook con HMAC inválido → 401 sin tocar DB.
- Webhook duplicado (mismo `external_id`) → 200 no-op (segundo INSERT OR IGNORE falla silenciosamente).
- Webhook con `status=rejected` → 200, `donations.status='rejected'`, NO email.
- E2E: webhook simulado llega 2x → DB tiene 1 sola fila de webhook_events_processed y 1 sola actualización.
