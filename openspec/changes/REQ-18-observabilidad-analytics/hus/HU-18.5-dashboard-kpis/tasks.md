# HU-18.5 — Dashboard de KPIs vs targets OE

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.5-dashboard-kpis`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/analytics/kpis.service.ts` con `computeOE1/2/3(env, windowMs)`, `getKpisSnapshot(env, window)`. Caching en KV con clave `cache:kpis:<window>` TTL 30s.
- [ ] **T2** Constantes `OE_TARGETS = { oe1_p95_ms: 500, oe2_precision: 0.8, oe3_donation_ratio: 0.8 }` (alineados con `docs/avance-1/03-fundamentacion-del-proyecto.md`).
- [ ] **T3** Validador `kpisQuery` en `src/lib/validators/admin/analytics.ts` (window enum 60m/24h/7d, default 60m).
- [ ] **T4** Endpoint `src/pages/api/v1/admin/analytics/kpis.ts` (GET, sesión admin). 401 sin sesión, 403 no-admin, 200 con forma `{oe1, oe2, oe3, generated_at}`.
- [ ] **T5** Componentes:
  - `src/components/admin/AnalyticsDashboard.astro` con prop `kpis`. Mockup `mockups/dashboard-admin.html:67-143`. Isla `client:load` que hace `setInterval(60000)` con fetch al endpoint.
  - `src/components/admin/KpiCard.astro` con props `{label, value, unit, target, comparator, status, sampleSize}`. Mockup `mockups/dashboard-admin.html:69-77`.
  - `src/components/admin/KpiEmptyState.astro` con prop `label`. Mockup `mockups/dashboard-admin.html:268-274`.
- [ ] **T6] Añadir nav-link "Analytics" en sidebar de `dashboard-admin.astro` siguiendo el patrón `mockups/dashboard-admin.html:22-39` (`<a data-target="analytics-section">`).
- [ ] **T7] Integrar sección `analytics-section` en `src/pages/dashboard-admin.astro` bajo anchor `#analytics`. SSR inicial con snapshot.
- [ ] **T8] Tests:
  - [ ] `tests/unit/services/analytics/kpis.test.ts` — `computeOE1/2/3` con fixtures D1; estados `ok/warn/fail/empty`; cache hit/miss.
  - [ ] `tests/integration/admin/analytics-kpis.test.ts` — GET sin sesión → 401; user → 403; admin → 200 + shape correcto; dataset vacío → todos `status:'empty'`.
  - [ ] `tests/e2e/admin-analytics.spec.ts` — login admin → entrar a `#analytics` → 3 widgets visibles; disparar `search` → en <60s el KPI OE1 cambia su `sample_size`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `computeOE2`, invertir el cálculo (numerador/denominador) → test unitario con fixture reporta ratio > 1 → restaurar
- [ ] Sabotaje 2: no distinguir `empty` de `0` → UI muestra "0" en lugar de "Sin datos aún", test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/analytics/kpis.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: dashboard KPIs vs targets OE` y push