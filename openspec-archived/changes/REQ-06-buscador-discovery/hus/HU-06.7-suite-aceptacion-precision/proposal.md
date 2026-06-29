# Propuesta — HU-06.7 — Suite de aceptación con precisión 100% (OE2)

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

REQ-06 está atado a OE2: "tasa de precisión 100% en suite de tests de
aceptación". Esto significa que antes de cada release, una suite de 30
queries representativas (con combinaciones de trade/comuna/rating/
verified) debe devolver exactamente el set esperado — cualquier delta
falla la suite. Esta HU crea el fixture, la tabla de queries esperadas
y la suite, más un bench de p95 < 500 ms.

## Mockups de referencia

No aplica (suite backend).

## Alternativas consideradas

### Opcion A — Fixture JSON (50 prestadores) + tabla de queries esperadas (30) + suite vitest que compara sets
- `tests/fixtures/search/providers-50.json` — 50 prestadores con combinaciones conocidas.
- `tests/fixtures/search/expected-queries.json` — 30 queries con `expected_ids: number[]`.
- Suite `tests/acceptance/search-precision.test.ts` corre cada query contra el endpoint y compara.
- Bench `tests/bench/search.bench.ts` mide p95 con `vitest.bench`.
- Pro: tests reproducibles, fácil de extender (agregar más queries al JSON).
- Pro: suite bloquea merge via CI.
- Contra: requiere mantener fixture sincronizado con el schema.

### Opcion B — Snapshot testing con respuestas completas
- Capturar response completo y comparar contra snapshot.
- Pro: trivial de escribir.
- Contra: cualquier cambio cosmético (orden de campos, formato de fecha) rompe el snapshot; no prueba semántica.

### Opcion C — Generar queries y esperados proceduralmente desde reglas
- Reglas: "todos los gasfiter verificados en Las Condes con rating >= 4.5" → genera la query y el esperado.
- Pro: menos mantenimiento.
- Contra: las reglas mismas pueden tener bugs; debugging más difícil.

## Decision

Se elige **Opcion A**. Es la única opción que cumple el criterio OE2
de "precisión 100%" con tests reproducibles y auditables. El fixture
es la fuente de verdad del "mundo" de pruebas; las queries esperadas
son el contrato del producto.

## Riesgos y mitigaciones

- Riesgo: el fixture diverge del schema real (faltan campos nuevos) → Mitigación: el loader del fixture valida contra `searchItemSchema` de HU-06.1 antes de sembrar.
- Riesgo: el bench es flaky por ruido del entorno → Mitigación: `vitest.bench` reporta p95 sobre N iteraciones; CI corre con `for i in {1..10}; do ... done` y toma mediana.
- Riesgo: la suite es lenta si cada query hace 30 requests → Mitigación: la suite usa una sola conexión D1 sembrada una vez; cada query es una llamada local.

## Metrica de exito

- `bunx vitest run tests/acceptance/search-precision.test.ts` → 30/30 verde.
- Cualquier cambio que rompa precisión → suite roja → bloquea merge.
- `bunx vitest bench tests/bench/search.bench.ts` → p95 < 500 ms.
- Job CI en REQ-26 (CI/CD) corre ambas verificaciones y bloquea merge si fallan.
