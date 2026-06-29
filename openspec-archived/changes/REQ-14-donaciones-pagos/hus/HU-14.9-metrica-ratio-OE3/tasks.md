# HU-14.9 — Métrica del ratio donaciones/costos (OE3)

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-14-donaciones-pagos
**Rama:** `feat/HU-14.9-metrica-ratio-OE3`

## Tareas tecnicas

- [ ] **T1** Función pura `computeRatio(donations, expenses)` en `src/lib/services/finance/ratio.ts` con 5 ramas (caso normal, expenses=0, donations=0, ambos=0, overflow).
- [ ] **T2] Helper `formatRatio(ratio | null, noExpenses)` en `src/lib/utils/format.ts`.
- [ ] **T3** Schema Zod `transparencyQuerySchema` en `src/lib/validators/transparency.ts`.
- [ ] **T4** Servicio `getTransparencySummary(env, { year, forceRefresh })` en `src/lib/services/finance/transparency.ts` con cache KV 5 min.
- [ ] **T5] Servicio `invalidateTransparencyCache(env)` para uso admin / eventos.
- [ ] **T6] Endpoint público `src/pages/api/v1/public/transparency/summary.ts` (`GET`) con `Cache-Control: public, max-age=300`.
- [ ] **T7] Headers `X-Cache: HIT|MISS`.
- [ ] **T8] Tests:
  - [ ] `tests/unit/finance/computeRatio.test.ts` — 5 casos.
  - [ ] `tests/unit/finance/formatRatio.test.ts` — null/noExpenses, null, 0.8, 0.625, 0.
  - [ ] `tests/unit/transparency/query-schema.test.ts` — year fuera de rango.
  - [ ] `tests/integration/finance/transparency-endpoint.test.ts` — ratio con seed; cache HIT; force_refresh MISS.
  - [ ] `tests/integration/finance/transparency-excludes-refunded.test.ts` — refunded NO suma.
  - [ ] `tests/e2e/transparency.spec.ts` — visitante ve /transparency; admin ve /dashboard-admin?section=finances.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/transparency.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: invertir `expenses === 0` por `===` (cualquier otro valor) → test "expenses=0 → null noExpenses" cae en rojo → restaurar
  - [ ] Sabotaje 2: comentar `WHERE status='approved'` en la query → test "refunded excluido" cae en rojo → restaurar
  - [ ] Sabotaje 3: cambiar `donations / expenses` por `expenses / donations` → test "ratio 800k/1M = 0.8" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/finance/ratio.ts` y `src/lib/services/finance/transparency.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
