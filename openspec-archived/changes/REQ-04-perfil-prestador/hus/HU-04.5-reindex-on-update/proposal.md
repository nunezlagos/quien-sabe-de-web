# Propuesta — HU-04.5 — Reindex de búsqueda al cambiar oficio o comuna

**Estado:** propuesta | **REQ padre:** REQ-04-perfil-prestador

## Contexto

El buscador de REQ-06 debe reflejar cambios de oficio o comuna en
menos de 1 segundo (criterio OE2). Si la HU-04.2 actualiza
`providers.trade_id` o `providers.commune_id` sin disparar reindex, la
búsqueda devuelve resultados stale hasta que un cron o trigger
arbitrario lo corrija. Esta HU define el contrato entre el servicio de
perfil y el indexer, y deja una función `reindexProvider(providerId)`
que REQ-06 implementa (vista materializada `provider_search_index`) y
dispara cuando hay diff relevante.

## Mockups de referencia

- HU 100% backend. No tiene UI directa.
- `mockups/dashboard-provider.html:131-143` — campo "Oficio Principal" (`<select>`) del form de edición. El handler que dispara reindex vive debajo de este control.

## Alternativas consideradas

### Opcion A — Hook explícito en el handler PATCH que compara diff y llama `reindexProvider`
- `updateProvider` retorna un flag `needsReindex: boolean`; el handler, si es true, hace `await reindexProvider(providerId)`.
- Pro: contrato explícito, fácil de testear (spy sobre `reindexProvider`).
- Pro: si la implementación del indexer cambia (cron vs trigger), el contrato no se rompe.
- Contra: requiere disciplina — si alguien agrega un nuevo caller de `updateProvider`, debe acordarse de leer el flag.

### Opcion B — Trigger SQL en D1 que actualiza `provider_search_index` automáticamente
- `CREATE TRIGGER after_provider_update ...`
- Pro: imposible olvidar — siempre se ejecuta.
- Contra: D1 sólo soporta un subconjunto de triggers; lógica compleja (full-text, joins con reviews) termina afuera del trigger de todos modos. Mezcla capas.

### Opcion C — Polling cada N segundos que detecta diffs por timestamp
- Cron `*/30 * * * *` que busca `updated_at > last_run` y reindexa.
- Pro: totalmente desacoplado del endpoint.
- Contra: latencia de hasta 30 s (rompe OE2 de <1 s). Además, requiere lock distribuido para que dos runs no se pisen.

## Decision

Se elige **Opcion A**. El flag `needsReindex` en el retorno de
`updateProvider` es simple, testeable y deja al indexer como servicio
inyectable. La latencia cumple el <1 s porque el reindex ocurre
inline dentro del handler (no espera a un cron).

## Riesgos y mitigaciones

- Riesgo: reindex se vuelve lento a medida que crece el catálogo → Mitigación: el indexer en HU-06.1 implementa la lógica; si supera 500 ms, se mueve a background job sin cambiar este contrato.
- Riesgo: diff no detecta `trade_id` cuando se pasa `null` → Mitigación: comparación con `===` y `!= null` explícito; test que verifica transición draft→valor→null.
- Riesgo: el flag se pierde si el handler olvida esperarlo (`for await updateProvider(...)`) → Mitigación: el servicio `updateProvider` retorna un objeto `{ provider, needsReindex, changedKeys }`; type-safe en TypeScript.

## Metrica de exito

- `PATCH /api/v1/providers/me { trade_id: 2 }` → `reindexProvider(42)` invocado exactamente 1 vez (verificable con spy en test).
- `PATCH /api/v1/providers/me { description: "nueva bio" }` → `reindexProvider` NO se invoca (spy cuenta 0).
- `GET /api/v1/search?trade=2` tras el PATCH retorna al prestador 42.
- `GET /api/v1/search?trade=1` tras el PATCH ya no retorna al prestador 42.
