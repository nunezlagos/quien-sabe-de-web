# HU-06.2 — Filtros combinables (comuna, rating, verified)

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.2-filtros-combinables`

## Tareas tecnicas

- [ ] **T1** Extender `searchParamsSchema` con `commune` y `minRating`.
- [ ] **T2** Agregar `LEFT JOIN ratings` (subquery `AVG(rating)` sobre `reviews` con `status='visible'`) en `queryBuilder.buildSearchQuery`. El JOIN siempre presente para que `rating_avg`/`rating_count` estén en cada item.
- [ ] **T3** Extender `applyFilters` con ramas para `commune` y `minRating > 0`. Documentar que `minRating=0` no agrega WHERE.
- [ ] **T4** Tests:
  - [ ] `tests/unit/search/queryBuilder.test.ts` (extender) — SQL contiene las cláusulas correctas para cada filtro presente/ausente.
  - [ ] `tests/integration/search/filters.test.ts` — filtros solos; combinaciones AND; `verified_only=false`; `min_rating=0` no filtra.
  - [ ] `tests/integration/search/empty-result.test.ts` — combinación sin matches → `items: []`.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar `applyFilters` para usar `OR` en vez de `AND` entre filtros → `tests/integration/search/filters.test.ts` (caso combinación AND) debe caer → restaurar.
- [ ] **S2** Quitar la condición `> 0` en `minRating` (siempre agregar WHERE aunque sea 0) → prestadores con rating 0 quedan excluidos; `tests/integration/search/filters.test.ts` debe caer → restaurar.
- [ ] **S3** Cambiar el `LEFT JOIN ratings` por `INNER JOIN` → prestadores sin reviews quedan excluidos; test que verifica que prestadores sin reviews aparecen con `rating_avg=null` debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `queryBuilder.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
