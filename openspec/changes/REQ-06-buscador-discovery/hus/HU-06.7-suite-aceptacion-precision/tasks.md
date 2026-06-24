# HU-06.7 — Suite de aceptación con precisión 100% (OE2)

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.7-suite-aceptacion-precision`

## Tareas tecnicas

- [ ] **T1** Crear fixture `tests/fixtures/search/providers-50.json` con 50 prestadores cubriendo combinaciones representativas (5 oficios x 5 comunas x verificado/no + ratings variados). Schema validable contra `searchItemSchema`.
- [ ] **T2** Crear `tests/fixtures/search/expected-queries.json` con 30 queries y sus `expected_ids`. Cada query cubre una combinación distinta (sólo trade, trade+commune, trade+rating, trade+verified=false, combinaciones AND, etc).
- [ ] **T3** Schema Zod `expectedQuerySchema` en `tests/fixtures/search/schema.ts`.
- [ ] **T4** Helper `loadFixture(db)` que inserta el fixture en D1 (idempotente: usa `INSERT OR IGNORE` o borra+resiembra).
- [ ] **T5** Suite `tests/acceptance/search-precision.test.ts`:
  - Setup: loadFixture.
  - Para cada query: `searchProviders(db, params)` → compara sets.
  - Reporte: si difiere, mensaje con `expected: [...]`, `actual: [...]`, `missing: [...]`, `extra: [...]`.
- [ ] **T6** Bench `tests/bench/search.bench.ts` con `vitest.bench` — 100 queries mixtas, reporta p50/p95/p99, verifica p95 < 500 ms.
- [ ] **T7** Documentar en `README.md` (o CONTRIBUTING) cómo correr la suite y cómo agregar una query al fixture.
- [ ] **T8** (Si REQ-26 ya mergeado) Agregar job CI que corra la suite y bloquee merge si falla.
- [ ] **T9** Tests:
  - [ ] `tests/acceptance/search-precision.test.ts` — 30 queries, todas verdes.
  - [ ] `tests/bench/search.bench.ts` — p95 < 500 ms.
  - [ ] `tests/unit/fixtures/search.test.ts` — validador de JSON.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar un `expected_id` en `expected-queries.json` a uno incorrecto → la suite debe caer al comparar sets → restaurar.
- [ ] **S2** Cambiar el fixture para que un prestador tenga `status='draft'` → las queries que lo esperan en el resultado deben caer → restaurar.
- [ ] **S3** Cambiar el threshold del bench de 500 ms a 0 ms → el bench debe tirar aunque el endpoint sea rápido → restaurar.

## Definition of done

- [ ] `docker exec quien-sabe-app bunx vitest run tests/acceptance/search-precision.test.ts` → 30/30 verde
- [ ] `docker exec quien-sabe-app bunx vitest bench tests/bench/search.bench.ts` → p95 < 500 ms
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en código de soporte de la suite (loader, validador)
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
