# Propuesta — HU-06.1 — Endpoint base de búsqueda por oficio

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

REQ-06 es la entrada principal de la plataforma (home + página
`/search`). Esta HU define el endpoint base
`GET /api/v1/search?trade=<slug>` que retorna prestadores publicados y
verificados. La seguridad por default es estricta: prestadores con
`status != 'published'` o sin verificación aprobada NO aparecen.
Filtros adicionales (comuna, rating, verified_only) viven en HU-06.2;
paginación en HU-06.3. Esta HU es el cimiento; HU-06.7 valida que la
precisión del set combinado sea 100%.

## Mockups de referencia

- `mockups/index.html:76-111` — hero search de la home (`<select id="trade-select">` poblado, input palabra clave, botón "Buscar"). El endpoint `/api/v1/search` se invoca desde este formulario.
- `mockups/index.html:317-359` — `grid-card-template` con `neighbor-name`, `neighbor-trade`, `verified-badge`, `neighbor-communes`, `neighbor-rating`, `neighbor-price`. Cada campo se mapea a la respuesta de `/api/v1/search`.
- `mockups/index.html:226-228` — `<div id="neighbors-container" class="grid ...">` recibe las cards inyectadas por JS desde la respuesta del endpoint.

## Alternativas consideradas

### Opcion A — Endpoint `/api/v1/search` con builder Drizzle parametrizable
- Query builder en `src/lib/services/search/queryBuilder.ts` que acepta `params: SearchParams` y devuelve `Drizzle.Sql`.
- Aplicar default `verified_only=true` (sólo verificados) y `status='published'`.
- Pro: extensible — HU-06.2 y HU-06.3 sólo agregan condiciones al builder.
- Pro: filtros combinables (AND) trivial con el builder.
- Contra: el builder se vuelve complejo; testing del builder vs testing del endpoint son capas distintas.

### Opcion B — Query SQL cruda con `?` placeholders y armado manual de WHERE
- Pro: cero capas intermedias.
- Contra: SQL injection-prone si se concatena mal; sin tipos; rompe con cambios de schema.

### Opcion C — Vista materializada `provider_search_index` consultada directo
- Pro: queries ultra rápidas si la vista está bien mantenida.
- Contra: requiere HU-04.5 + cron de refresh; complejidad extra. Out of scope para HU-06.1 (base).

## Decision

Se elige **Opcion A**. Builder Drizzle con tipos seguros es el patrón
que el resto del proyecto usa y permite extender sin reescribir.
HU-06.7 cierra el ciclo con tests de aceptación sobre este builder.

## Riesgos y mitigaciones

- Riesgo: `verified_only=true` por default rompe debug/admin → Mitigación: el flag es overridable por query param (`?verified_only=false`); la respuesta en ese caso está claramente marcada como "incluye no verificados".
- Riesgo: query lenta sin índices → Mitigación: `idx_providers_trade_commune` (HU-04.1) y `idx_services_provider_status` (HU-05.1) cubren los accesos principales; `EXPLAIN QUERY PLAN` en bench HU-06.7.
- Riesgo: trade slug inexistente devuelve error 500 en vez de lista vacía → Mitigación: el builder hace `LEFT JOIN trades` con filtro opcional; si no matchea, devuelve lista vacía sin error.

## Metrica de exito

- `GET /api/v1/search?trade=gasfiter` con 5 prestadores seed publicados y verificados → 200 con 5 items, cada uno con shape canónico.
- `GET /api/v1/search` sin params → mix de prestadores ordenados por relevancia default.
- `GET /api/v1/search?trade=inexistente` → 200 con `{items: [], cursor: null}`.
- Prestadores con `status='draft'` o sin verificación → excluidos.
