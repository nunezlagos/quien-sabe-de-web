# Propuesta — HU-06.3 — Paginación cursor-based estable

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

La búsqueda debe paginar sin duplicar ni saltar resultados cuando se
insertan filas concurrentemente (HU-06.1 lo necesita para soportar 50+
resultados con `limit=10`). La paginación offset-based tradicional
(`?offset=10`) rompe en escenarios concurrentes. Cursor-based con
keyset pagination (`WHERE (created_at, id) < (last_seen_created_at, last_seen_id)`)
es estable: un insert concurrente no afecta páginas siguientes porque
sólo aparece al inicio, no entremedio.

## Mockups de referencia

- HU 100% backend. La UI de "Siguiente página" / "Cargar más" se entrega en HU-06.6 (vista grid/lista) y HU-12.
- `mockups/index.html:225-228` — `<div id="neighbors-container">` recibe las cards; el botón "Cargar más" se monta como hermano (no en mockup actual, decisión de diseño).

## Alternativas consideradas

### Opcion A — Cursor opaco (base64url de `{created_at, id}`) con keyset pagination
- Cursor = `base64url(JSON.stringify({c: created_at, i: id}))`.
- Server: `WHERE (created_at < ?) OR (created_at = ? AND id < ?)` con orden `(created_at DESC, id DESC)`.
- Pro: cursor es opaco para el cliente; el cliente no puede construir cursors inválidos sin saber el formato.
- Pro: estable bajo inserts concurrentes (los nuevos aparecen sólo en página 1, nunca entremedio).
- Contra: requiere orden determinista por `(created_at, id)`.

### Opcion B — Cursor numérico incremental (`?after=123`)
- Pro: simple.
- Contra: el cliente puede manipularlo; salta a IDs arbitrarios.

### Opcion C — `?offset=N&limit=M`
- Pro: trivial de implementar.
- Contra: con inserts concurrentes, página 2 puede repetir/skipear items (clásico bug de offset).

## Decision

Se elige **Opcion A**. Es el patrón estándar de keyset pagination,
opaco al cliente, estable bajo concurrencia. El cursor corrupto o
manipulado devuelve 400 con error claro, sin filtrar información.

## Riesgos y mitigaciones

- Riesgo: cursor base64 puede contener caracteres problemáticos en URL → Mitigación: usar `base64url` (no `base64` standard); sanitizar antes de decode.
- Riesgo: orden `(created_at, id)` requiere que `created_at` esté indexado → Mitigación: índice `idx_providers_created` o `idx_providers_created_id` agregado en T1.
- Riesgo: con `sort=relevance` o `sort=rating_desc` el keyset por `created_at` no aplica → Mitigación: para esos modos de sort, paginación es best-effort (documentado); la estabilidad se garantiza con `sort=recent` (default para paginación infinita) o se desactiva paginación.

## Metrica de exito

- 25 prestadores seed. `?limit=10` → 10 items + cursor no null. Segunda página con cursor → 10 items sin duplicar los primeros.
- `cursor=abc%xyz` (corrupto) → 400 con `{ error: "cursor inválido" }`.
- Insert concurrente de un 21° prestador entre página 1 y 2 → ninguno de los 20 originales se duplica ni se saltea; el nuevo aparece en página 1 de una nueva query.
