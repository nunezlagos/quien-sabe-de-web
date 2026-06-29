# Propuesta — HU-18.4 — Doble emisión a Cloudflare Analytics Engine

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

D1 cubre persistencia y queries SQL ad-hoc, pero las agregaciones de KPIs en tiempo cuasi-real (≤5 min, criterio del REQ-18) son baratas y rápidas en Cloudflare Analytics Engine. Esta HU añade emisión paralela al binding `ANALYTICS` sin sacrificar el contrato de D1: si Analytics Engine falla o no está configurado, el insert D1 sigue su curso y el handler responde 204.

## Mockups de referencia

HU backend (capa de servicios). Sin mockup directo. Los consumidores de Analytics Engine se ven en:

- `mockups/dashboard-admin.html:107-143` — bar chart "Visitas Semanales" cuyo backend en producción puede preferir Analytics Engine sobre D1 por costo de query.

## Alternativas consideradas

### Opción A — Cliente envoltorio en `analytics/engine.ts` con guard `if (env.ANALYTICS)` y try/catch interno
- Un módulo expone `writeAnalyticsEvent(env, payload)`; encapsula el guard de binding y captura excepciones.
- Pro: el handler queda limpio (una sola línea), cubre los tres Gherkin (paralela, falla no rompe D1, sin binding no lanza).
- Contra: pequeño overhead de capa.

### Opción B — Emisión inline en el handler
- Llamar `env.ANALYTICS?.writeDataPoint(...)` directamente en `track.ts`.
- Pro: mínimo código.
- Contra: dispersa la conversión de payload Analytics y dificulta testear con mock.

### Opción C — Cola intermedia (Cloudflare Queues) → consumer escribe en Analytics Engine
- Encolar y consumir en background.
- Pro: aislamiento total.
- Contra: añade binding y complejidad; latencia adicional; no requerido para el escenario actual.

## Decisión

Se adopta **Opción A**. El módulo dedicado permite mockear el binding en tests (`tests/integration/events/analytics-engine.test.ts`) y mantener el handler legible. El guard explícito cubre el Gherkin "sin binding configurado".

## Riesgos y mitigaciones

- `writeDataPoint` arroja por payload mal formado → captura interna del módulo evita romper la respuesta 204.
- Mapeo D1 ↔ Analytics Engine divergente → el módulo encapsula la conversión (`blobs`, `doubles`, `indexes`) en un solo lugar.
- Plan CF sin Analytics Engine → el guard `if (env.ANALYTICS)` lo trata como degradación silenciosa; D1 sigue siendo fuente de verdad.

## Métrica de éxito

- Tests de integración verdes con mock del binding: inserta en D1 y llama a `writeDataPoint` una vez por request.
- Forzando `env.ANALYTICS = undefined` (vía test override) el endpoint sigue respondiendo 204 e insertando en D1.
- Forzando `writeDataPoint` a lanzar, D1 inserta y respuesta sigue siendo 204.
