# HU-06.7 — Suite de aceptación con precisión 100% (OE2)

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** equipo de producto
**Quiero** garantizar 100% de precisión en una suite de queries representativas
**Para** cumplir el indicador OE2 antes de cada release

## Criterios de aceptación (Gherkin)

### Escenario: Suite de 30 queries de aceptación pasa
  Dado un fixture de 50 prestadores cubriendo combinaciones de trade/comuna/rating
  Cuando ejecuto la suite `tests/acceptance/search-precision.test.ts`
  Entonces las 30 queries devuelven exactamente el set esperado
  Y la precisión calculada es 100%

### Escenario: Una query con falso positivo falla la suite
  Dado un resultado inesperado en una query
  Cuando se corre la suite
  Entonces el test marca la query y reporta el delta esperado/actual

### Escenario: Benchmark p95 < 500 ms
  Cuando ejecuto `vitest.bench` sobre el endpoint
  Entonces el p95 medido es < 500 ms

## Tareas técnicas

- [ ] Fixture `tests/fixtures/search/providers-50.json`
- [ ] Tabla de queries esperadas `tests/fixtures/search/expected-queries.json`
- [ ] Suite `tests/acceptance/search-precision.test.ts`
- [ ] Bench `tests/bench/search.bench.ts` con `vitest.bench`
- [ ] Job CI bloquea merge si precisión < 100% o p95 ≥ 500 ms

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
