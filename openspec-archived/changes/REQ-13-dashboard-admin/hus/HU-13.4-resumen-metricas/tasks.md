# HU-13.4 — Widgets de métricas globales (KPIs)

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.4-resumen-metricas`

## Tareas tecnicas

- [ ] **T1** Schema Zod `kpisQuerySchema` en `src/lib/validators/admin-kpis.ts`.
- [ ] **T2** Helper `safeQuery<T>(fn, fallback): Promise<KpiResult<T>>` que ejecuta la query con timeout 2s y devuelve `{ value, pendingData: true }` si falla o expira.
- [ ] **T3** Servicio `getKpis(env, { forceRefresh })` en `src/lib/services/admin/kpis.ts` con las 5 queries descritas en design.md y cache KV.
- [ ] **T4** Helper `formatPercent`, `formatMs`, `formatRatio` en `src/lib/utils/format.ts` (uso compartido con HU-14.9).
- [ ] **T5** Servicio `invalidateKpisCache(env)` para uso desde REQ-18 / admin manual.
- [ ] **T6** Endpoint `src/pages/api/v1/admin/analytics/kpis.ts` (`GET`) con guard HU-13.1 + header `X-Cache`.
- [ ] **T7** Componente `KpiCard.astro` con props `{ title, value, pendingData, iconClass }`.
- [ ] **T8** Componente `KpisOverview.astro` con grid 5 columnas + botón "Refrescar".
- [ ] **T9** Cablear `KpisOverview` en la sección `dashboard-section` de `dashboard-admin.astro`.
- [ ] **T10** Tests:
  - [ ] `tests/unit/admin-kpis/formatKpis.test.ts` — null con pending_data; coma decimal; CLP format.
  - [ ] `tests/unit/utils/safeQuery.test.ts` — query OK → value; query timeout → pending_data.
  - [ ] `tests/integration/admin/kpis-cache.test.ts` — MISS primera; HIT segunda; force_refresh MISS again; invalidación manual MISS.
  - [ ] `tests/integration/admin/kpis-queries.test.ts` — seed 100 signups/30d → value 100; ratio correcto con fixtures.
  - [ ] `tests/integration/admin/kpis-rbac.test.ts` — vecino 403; sin sesión 401.
  - [ ] `tests/e2e/admin-kpis.spec.ts` — admin ve 5 cards; click refrescar cambia computed_at.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-kpis.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `await env.KV.put('kpis:global', ..., { expirationTtl: 300 })` → test "segunda llamada es HIT" cae en rojo → restaurar
  - [ ] Sabotaje 2: quitar el `forceRefresh` del read path → test "force_refresh MISS again" cae en rojo → restaurar
  - [ ] Sabotaje 3: invertir el `cache: 'HIT'` por `'MISS'` en el read path → test E2E de header X-Cache cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/kpis.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
