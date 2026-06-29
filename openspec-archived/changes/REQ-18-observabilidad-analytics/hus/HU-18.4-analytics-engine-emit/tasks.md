# HU-18.4 — Doble emisión a Cloudflare Analytics Engine

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.4-analytics-engine-emit`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/analytics/engine.ts` con `hasAnalyticsBinding(env)`, `writeAnalyticsEvent(env, payload)`, `toDataPoint(payload)`. Envolvente en try/catch que traga cualquier excepción.
- [ ] **T2] Añadir binding en `wrangler.toml.example`:
  ```toml
  [[analytics_engine_datasets]]
  binding = "ANALYTICS"
  dataset = "qsd_events"
  ```
- [ ] **T3] Añadir `ANALYTICS?: AnalyticsEngineDataset` al tipo `Env` en `src/env.d.ts`.
- [ ] **T4** Enganchar `writeAnalyticsEvent` al final del handler de HU-18.3 (después de `insertEvent` D1). Independiente: si falla Analytics, D1 sigue insertada y se responde 204.
- [ ] **T5** Documentar en README que en dev local no hay Analytics Engine real → el guard degrada a D1-only.
- [ ] **T6** Tests:
  - [ ] `tests/unit/services/analytics/engine.test.ts` — `toDataPoint` mapea correctamente; `writeAnalyticsEvent` no lanza con binding `undefined`; con mock que lanza, no propaga.
  - [ ] `tests/integration/events/analytics-engine.test.ts` — POST a `/api/v1/events/track` con mock de binding → `writeDataPoint` llamado con payload esperado; mock lanzando → D1 igual inserta, respuesta 204; sin binding → solo D1.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `writeAnalyticsEvent`, no envolver en try/catch → excepción rompe el handler, test integración rojo → restaurar
- [ ] Sabotaje 2: omitir `hasAnalyticsBinding` y llamar `env.ANALYTICS.writeDataPoint` directo → en dev local (sin binding) explota, test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/analytics/engine.ts`
- [ ] Type check verde
- [ ] Commit `feat: doble emisión a Analytics Engine` y push