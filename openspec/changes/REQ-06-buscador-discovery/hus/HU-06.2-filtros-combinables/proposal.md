# Propuesta — HU-06.2 — Filtros combinables (comuna, rating, verified)

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

El vecino no busca sólo por oficio. Quiere restringir a su comuna, a
prestadores con rating mínimo y, opcionalmente, ver los no verificados
(`?verified_only=false`). Esta HU extiende el `queryBuilder` de
HU-06.1 con tres filtros adicionales que se combinan con AND lógico.
El rating se calcula como subquery agregada sobre `reviews` con
`status='visible'`.

## Mockups de referencia

- `mockups/index.html:160-212` — sidebar de filtros de la home/search:
  - Oficio (checkboxes, líneas 161-182)
  - Precio Base (inputs min/max, líneas 184-192)
  - Valoración (radios con estrellas, líneas 194-212)
- El comportamiento del sidebar mapea 1:1 a `?trade=&min_rating=&verified_only=`.
- `mockups/index.html:89-97` — `<select id="commune-select">` se traduce a `?commune=<slug>`.

## Alternativas consideradas

### Opcion A — Extender `queryBuilder` con AND de WHERE conditions; rating como subquery agregada
- `applyFilters` recibe `params` y agrega `WHERE` según presencia de cada filtro.
- `rating_avg` se calcula con `LEFT JOIN (SELECT provider_id, AVG(rating) ... FROM reviews WHERE status='visible')` para no romper índices.
- Pro: extensible (futuros filtros sólo agregan condición).
- Pro: la subquery agregada se materializa una sola vez por query.
- Contra: la subquery puede ser cara con muchos reviews.

### Opcion B — Pre-computar `rating_avg` en una columna denormalizada
- Trigger actualiza `providers.rating_avg` en cada review.
- Pro: query barata.
- Contra: requiere migración adicional + sincronización; drift si el trigger falla.

### Opcion C — Calcular rating en el cliente con un segundo endpoint
- `/api/v1/search` retorna IDs; cliente hace `GET /api/v1/providers/:id/rating` por cada uno.
- Pro: query `/search` ultra rápida.
- Contra: N+1 requests; rompe el contrato de "items completos" de HU-06.1.

## Decision

Se elige **Opcion A**. La subquery agregada es la única opción que
mantiene el shape canónico de HU-06.1 (cada item con `rating_avg`
incluido) sin agregar requests ni denormalización riesgosa. El
rendimiento se mide en HU-06.7; si supera p95, se considera la
materialización como optimización futura.

## Riesgos y mitigaciones

- Riesgo: subquery de rating correlacionada con muchos reviews (miles) vuelve la query lenta → Mitigación: índice `idx_reviews_provider_status` (de REQ-09, asumido) cubre el `WHERE provider_id = ? AND status='visible'`; bench en HU-06.7.
- Riesgo: filtro de comuna por slug requiere JOIN con `communes`; el builder de HU-06.1 ya lo tiene, sólo hay que agregar la condición `WHERE communes.slug = ?` → Mitigación: builder ya está preparado.
- Riesgo: `min_rating` con valor 0 (sin filtro) no debe agregar WHERE → Mitigación: la condición sólo se agrega si `params.minRating != null && params.minRating > 0`.

## Metrica de exito

- `?trade=gasfiter&commune=las-condes` → sólo prestadores con `commune.slug='las-condes'` O con `service_coverage` que la incluya (decisión de diseño: HU-06.1 ya filtra por `commune_id` del provider; HU-06.2 podría extender a cobertura — para esta HU, sólo por `commune_id` del provider, documentado).
- `?trade=gasfiter&min_rating=4` → sólo rating >= 4.
- `?trade=gasfiter&commune=nunoa&min_rating=4.5&verified_only=true` → todas las condiciones AND.
- `?trade=gasfiter&verified_only=false` → incluye no verificados.
