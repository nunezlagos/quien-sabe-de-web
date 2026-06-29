# Propuesta — HU-18.3 — Endpoint POST /events/track con rate-limit

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

El endpoint es la frontera de confianza entre el helper cliente (HU-18.2) y la persistencia (HU-18.1). Debe validar el shape exacto, rechazar PII, derivar `actor_role` desde sesión, aplicar rate-limit por IP-hash en KV y devolver 204 sin filtrar información. Es prerequisito para que cualquier dato llegue a `events_log` y, por tanto, al dashboard (HU-18.5) y al listado de debug (HU-18.6).

## Mockups de referencia

HU backend. No hay mockup directo. Disparadores que se observan en mockups:

- `mockups/js/home.js:273-278` — listeners de búsqueda que invocarán el endpoint vía HU-18.2.
- `mockups/dashboard-admin.html:67-105` — KPIs cuya fuente proviene de filas insertadas por este endpoint.

## Alternativas consideradas

### Opción A — Endpoint Astro server-route con Zod discriminado por `event`, rate-limit en KV
- Un único archivo `src/pages/api/v1/events/track.ts`; Zod `z.discriminatedUnion('event', [...])` con esquemas por evento; rate-limit con clave `rl:event:<ip_hash>` y TTL 60s; `actor_role` derivado del middleware de sesión (`Astro.locals`).
- Pro: cubre los 4 Gherkin (insert, 422 PII, 429 rate-limit, 422 evento desconocido), una sola route, validación tipada.
- Contra: la discriminatedUnion crece con cada evento nuevo (mantenimiento controlado).

### Opción B — Endpoint laxo + filtrado en servicio
- Aceptar cualquier `props`, filtrar en servicio antes del insert.
- Pro: menos código de schema.
- Contra: difícil de auditar, no devuelve 422 explícito → viola los Gherkin.

### Opción C — Rate-limit en Durable Object en lugar de KV
- Usar DO para contadores fuertes.
- Pro: consistencia estricta.
- Contra: complejidad y costo desproporcionados para un contador con TTL 60s; KV con `expirationTtl` es suficiente.

## Decisión

Se adopta **Opción A**. Es la única que satisface los cuatro escenarios Gherkin con código auditable y reutiliza el binding `SESSION` de KV ya presente en `wrangler.toml`. La discriminatedUnion sirve a su vez como fuente de verdad para sincronizar con la allowlist cliente (HU-18.2).

## Riesgos y mitigaciones

- Race condition en contador KV bajo carga → tolerable; KV con `get/put` y TTL es suficiente para 100 req/min por IP; si se vuelve crítico, migrar a DO.
- IP detrás de CDN → derivar `ip_hash` desde `CF-Connecting-IP` (header de Cloudflare) y aplicar SHA-256 antes de usarla.
- `actor_role` ausente cuando no hay sesión → fallback explícito a `'anonymous'`.
- Evento futuro sin Zod → la discriminatedUnion devuelve 422 automáticamente; cubre el Gherkin 4.

## Métrica de éxito

- Tests de integración (`tests/integration/events/track.test.ts`) verdes en los 4 escenarios.
- En dev, al disparar `track('search', { trade:'gasfiter' })` desde la consola del browser, aparece una fila en `events_log` con `actor_role='anonymous'` y la respuesta del servidor es 204.
- 101 requests consecutivos desde la misma IP en <60s devuelven 429 a partir del 101.
