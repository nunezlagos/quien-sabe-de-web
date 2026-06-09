# HU-04.5 — Reindex de búsqueda al cambiar oficio o comuna

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** sistema
**Quiero** mantener el índice de búsqueda consistente con los perfiles
**Para** que cambios de oficio/comuna se reflejen en resultados sin demora

## Criterios de aceptación (Gherkin)

### Escenario: Cambio de oficio dispara reindex
  Dado un prestador con `trade_id=1`
  Cuando envía `PATCH /api/v1/providers/me` con `{"trade_id":2}`
  Entonces se invoca `reindexProvider(providerId)`
  Y la próxima búsqueda por `trade=2` lo retorna
  Y la búsqueda por `trade=1` ya no lo retorna

### Escenario: Cambio de comuna dispara reindex
  Cuando un prestador cambia su `commune_id`
  Entonces el índice refleja la nueva comuna en máximo 1 s

### Escenario: Cambio de campo no relevante no reindexa
  Cuando un prestador cambia sólo `description`
  Entonces NO se invoca `reindexProvider` (verificable por spy)

## Tareas técnicas

- [ ] Servicio `src/lib/services/search/indexer.ts` con `reindexProvider(id)`
- [ ] Hook en handlers PATCH de `providers` que compara diff y decide reindex
- [ ] Si existe vista materializada `provider_search_index`, recompute por fila
- [ ] Tests `tests/unit/search/indexer.test.ts`, `tests/integration/providers/reindex.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
