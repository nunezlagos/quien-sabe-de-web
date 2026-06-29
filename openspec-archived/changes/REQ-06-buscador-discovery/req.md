# REQ-06-buscador-discovery

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE2

## Descripción

Buscador principal: input de oficio (autocompletado), filtros combinables
(comuna, rating mínimo, sólo verificados, vista grid/lista), ordenamiento
(relevancia, rating, recientes), paginación cursor-based. Es la entrada
principal a la plataforma desde la home.

## Criterios de éxito

- [ ] OE2: tasa de precisión 100 % en suite de tests de aceptación.
- [ ] p95 < 500 ms para query típica (10 prestadores devueltos).
- [ ] Filtros combinables stackean correctamente (AND lógico).
- [ ] Resultados se mantienen al volver atrás del navegador (state en URL).
- [ ] Paginación cursor-based estable (no duplica/saltea con inserts concurrentes).

## Superficie técnica

### Endpoints API
- `GET /api/v1/search` — query params: `trade`, `commune`, `min_rating`, `verified_only`, `cursor`, `limit`, `sort` [público]
- `GET /api/v1/search/autocomplete` — oficios/comunas [público]

### Vistas Astro
- `/` (home con buscador)
- `/search` (results page con filtros)

### Tablas Drizzle
- Lectura de `providers`, `services`, `service_coverage`, `trades`, `communes`, `reviews` (agg)
- Posible vista materializada `provider_search_index` (regenerada por triggers o cron)

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-06.1 | endpoint-search-base | Endpoint con query por oficio | P0 |
| HU-06.2 | filtros-combinables | comuna + rating + verified | P0 |
| HU-06.3 | paginacion-cursor | Cursor estable + límite | P0 |
| HU-06.4 | autocomplete | Sugerencias para oficio/comuna | P1 |
| HU-06.5 | state-url | Sincroniza filtros con URL | P1 |
| HU-06.6 | vista-grid-lista | Switch UI grid/lista | P2 |
| HU-06.7 | suite-aceptacion-precision | Suite de fixtures con asserts de precisión 100 % | P0 |

## Tests requeridos

- **Unit:** builder de query Drizzle según params, parser de cursor.
- **Integración:** seed de 50 prestadores → cada combinación de filtros validada contra resultado esperado; p95 medido con `vitest.bench`.
- **E2E:** usuario navega home → tipea oficio → aplica filtros → resultados consistentes; back/forward del browser mantiene estado.

## Dependencias

- **Depende de:** REQ-04, REQ-05
- **Habilita a:** REQ-07 (link a perfil público)

## Riesgos / suposiciones

- D1 no tiene full-text search nativo robusto: arrancamos con `LIKE` + índices y migramos a FTS5 si escala.
- Edge cache de respuestas de búsqueda con TTL corto (60 s) para alivianar D1.
