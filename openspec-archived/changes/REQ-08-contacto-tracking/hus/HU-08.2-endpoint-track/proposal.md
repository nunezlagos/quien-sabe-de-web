# Propuesta — HU-08.2 — Endpoint POST /contacts/track con rate-limit

**Estado:** propuesta | **REQ padre:** REQ-08-contacto-tracking

## Contexto

El cliente del perfil público debe poder registrar un contacto efectivo (clic en WhatsApp, llamada o email) antes de redirigir al destino externo. El endpoint debe ser público (sin sesión), rápido y resistente a abuso vía rate-limit por `ip_hash`. Aporta directamente a OE2 (volumen de contactos efectivos) sin exponer PII del solicitante.

## Mockups de referencia

- `mockups/profile.html:93-98` — botones WhatsApp y email del perfil público que dispararán este endpoint.
- `mockups/index.html:369-371` — botón WhatsApp en cards del listado de búsqueda.
- `mockups/index.html:417-422` — botones WhatsApp y email en plantilla `list-card-template`.
- `mockups/js/profile.js:27` y `mockups/js/profile.js:32` — wiring actual de `wa.me/` y `mailto:` (sin tracking) que esta HU va a interceptar.
- `mockups/js/data.js:45` — modelo `contact: { phone, whatsapp, email }` que define los `kind` válidos.

## Alternativas consideradas

### Opcion A — Endpoint dedicado `POST /api/v1/contacts/track` con KV rate-limit
- Endpoint Astro server con validación Zod, hash SHA-256 con salt mensual, rate limit en KV con TTL 1h.
- Pro: alineado con la convención del proyecto (`src/pages/api/v1/...`).
- Pro: KV ofrece TTL nativo, ideal para ventanas fijas simples.
- Contra: la ventana es fija por hora (no deslizante real), pero suficiente para 30 req/h.

### Opcion B — Cloudflare Rate Limiting binding nativo
- Usar el binding `RateLimit` de Workers en lugar de KV.
- Pro: implementación oficial, mejor para alto volumen.
- Contra: aún en GA progresiva; añade un binding más al `wrangler.toml`.
- Contra: menos control sobre la clave (forzaría `ip_hash` como key estructurada).

### Opcion C — Sin rate-limit, depender solo de Cloudflare WAF
- Confiar en reglas externas (Cloudflare dashboard).
- Pro: cero código.
- Contra: el control queda fuera del repo; difícil de testear y versionar; alternativa rechazada por no ser auditable.

## Decision

Se elige **Opcion A**. KV con TTL 1h es suficiente para el objetivo declarado (30 contactos/hora/IP), reutiliza un binding ya disponible y es trivial de testear con `@cloudflare/vitest-pool-workers`. Si el volumen escala, migrar a Opcion B sin cambios de contrato.

## Riesgos y mitigaciones

- Riesgo: `provider_id` enumerado puede inflar métricas → Mitigación: validar existencia del provider (422 si no existe) y rate-limit por IP.
- Riesgo: detrás de NAT corporativo, varias personas comparten ip_hash → Mitigación: 30/hora es holgado; documentar el límite como por-IP-pública, no por-usuario.
- Riesgo: salt cambia a mitad de hora y desincroniza contador → Mitigación: la rotación ocurre el día 1 de mes a las 00:00 UTC; la ventana de 1h se cierra naturalmente.
- Riesgo: bot envía bursts en menos de 1s → Mitigación: KV es eventualmente consistente, pero el contador acumula; en peor caso permite ~+5 por debajo del límite real.

## Metrica de exito

- Tests integración cubren los 4 escenarios Gherkin (204, 422, 429, 400).
- `curl -X POST /api/v1/contacts/track ...` produce 204 y aparece una fila nueva en `contact_events`.
- 31 requests seguidos desde el mismo IP en menos de 1h producen 30 con 204 + 1 con 429.
