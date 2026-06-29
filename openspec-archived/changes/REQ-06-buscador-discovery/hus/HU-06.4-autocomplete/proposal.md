# Propuesta — HU-06.4 — Autocompletado de oficios y comunas

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

Mientras el vecino tipea en el buscador de la home, queremos sugerir
oficios y comunas que matcheen. La latencia de UX es <100 ms para que
la lista se sienta instantánea. Las queries deben ser accent-insensitive
("nunoa" y "Ñuñoa" matchean). El endpoint es público y cacheable en
edge con TTL corto (60 s) para aliviar D1.

## Mockups de referencia

- `mockups/index.html:81-84` — `<select id="trade-select">` poblado por JS con los oficios del catálogo. Reemplazar/alternar con `<datalist>` o componente custom que llame a `/autocomplete`.
- `mockups/index.html:93-96` — `<select id="commune-select">` igual patrón para comunas.

## Alternativas consideradas

### Opcion A — Endpoint `GET /api/v1/search/autocomplete?q=&kind=` con `LIKE` + índice + accent normalize
- `kind ∈ {'trade', 'commune'}`.
- `q` se normaliza con `normalizeAccents` (NFD + remove diacritics + lowercase).
- Query: `WHERE slug_normalized LIKE ? OR name_normalized LIKE ?` con `LIMIT 10`.
- Pro: simple, SQLite soporta funciones unicode via `ICU` (disponible en D1).
- Contra: `LIKE '%foo%'` no usa índice a menos que sea prefijo; documentar que el autocomplete es siempre prefijo (`q%`).

### Opcion B — FTS5 (full-text search) sobre `trades` y `communes`
- Pro: queries sofisticadas, ranking por relevancia.
- Contra: D1 no soporta FTS5 de forma estable (en revisión); agrega complejidad sin beneficio claro para este caso (sólo prefijo).

### Opcion C — Pre-cargar todo el catálogo al cliente y filtrar en JS
- Pro: cero latencia de red.
- Contra: dataset puede crecer (oficios actualmente <100, comunas 52, pero en el futuro podría incluir más); no es la opción correcta cuando el catálogo escala.

## Decision

Se elige **Opcion A**. Mantiene el catálogo en el server, normaliza
acento, usa prefijo (aprovecha índice) y devuelve resultados
canónicos. Edge cache de 60 s reduce carga en D1.

## Riesgos y mitigaciones

- Riesgo: edge cache devuelve resultados viejos si se agrega un oficio nuevo → Mitigación: TTL 60 s es aceptable para autocomplete (no es crítico).
- Riesgo: `q` muy corto ("a") devuelve demasiados resultados → Mitigación: mínimo 2 caracteres, retorn `[]` si `q.length < 2`.
- Riesgo: D1 no soporta la función de normalización NFD → Mitigación: la normalización se hace en el cliente (helper `normalizeAccents`); la query matchea contra una columna denormalizada `slug_normalized` que se llena en INSERT/UPDATE (HU-02.1 y HU-04.1 ya tienen `slug`; agregar `slug_normalized` en migración).

## Metrica de exito

- `?q=gas&kind=trade` → `[{slug: "gasfiter", name: "Gasfíter"}, {slug: "gasista", name: "Gasista"}]`.
- `?q=ñu&kind=commune` → `[{slug: "nunoa", name: "Ñuñoa"}]`.
- `?q=a` → `[]`.
- `?q=nunoa` y `?q=Ñuñoa` (kind=commune) → ambos retornan `[{slug: "nunoa", name: "Ñuñoa"}]`.
- Latencia p95 <100 ms (medible en bench HU-06.7).
