# HU-06.1 — Endpoint base de búsqueda por oficio

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.1-endpoint-search-base`

## Tareas tecnicas

- [ ] **T1** Definir `searchParamsSchema` en `src/lib/validators/searchParams.ts` (sólo `trade`, `verifiedOnly`, `limit`, `sort` por ahora).
- [ ] **T2** Builder `buildSearchQuery` en `src/lib/services/search/queryBuilder.ts` que genera SQL con JOINs a `trades`, `communes`, `verifications`, `services`. Default: `verifiedOnly=true`, `status='published'`, al menos 1 servicio `active`.
- [ ] **T3** Servicio `searchProviders(db, params)` que ejecuta `Promise.all([itemsQuery, countQuery])` cuando `cursor=null`, o sólo `itemsQuery` cuando hay cursor.
- [ ] **T4** Helper `mapRowToSearchItem(row)` que resuelve shape canónico (joins a objetos anidados, `photo_url` desde `photoR2Key`, etc).
- [ ] **T5** Endpoint `src/pages/api/v1/search/index.ts` con GET. Zod-valida params, llama servicio, devuelve `{items, cursor, total}`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/search/queryBuilder.test.ts` — SQL generado para cada combinación; defaults aplicados.
  - [ ] `tests/unit/search/search.test.ts` — mapeo fila → item canónico.
  - [ ] `tests/integration/search/base.test.ts` — seed 50 prestadores; `?trade=gasfiter` retorna los esperados; `?trade=inexistente` []; no verificados excluidos; drafts excluidos.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar el default de `verifiedOnly` a `false` → `tests/integration/search/base.test.ts` (caso "no verificados excluidos") debe caer → restaurar.
- [ ] **S2** Quitar el filtro `status='published'` del builder → drafts aparecen en búsqueda; test correspondiente debe caer → restaurar.
- [ ] **S3** Cambiar `mapRowToSearchItem` para que devuelva `trade.slug` como `trade.name` → test de shape canónico debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/search/queryBuilder.ts` y `search.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
