# Diseno tecnico — HU-06.4 — Autocompletado de oficios y comunas

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

Requiere columna denormalizada `slug_normalized` en `trades` y `communes` para queries accent-insensitive con índice.

```sql
-- Migración 0006_autocomplete_normalized.sql (o consolidada con 0005)
ALTER TABLE trades ADD COLUMN slug_normalized TEXT;
ALTER TABLE communes ADD COLUMN slug_normalized TEXT;
UPDATE trades SET slug_normalized = lower(slug);  -- diacritics ya removidos al crear slug
UPDATE communes SET slug_normalized = lower(slug);
CREATE INDEX idx_trades_slug_normalized ON trades(slug_normalized);
CREATE INDEX idx_communes_slug_normalized ON communes(slug_normalized);
```

Como `slug` se genera con `slugify` que ya lowercasea y puede remover acentos (decisión en HU-04.1 / HU-02.1), `slug_normalized = lower(slug)` es suficiente.

## Contrato de API

### `GET /api/v1/search/autocomplete`

**Query params**
- `q` (string, requerido, min 2 chars)
- `kind` (`trade|commune`, requerido)

**Response 200**
```json
[
  { "slug": "gasfiter", "name": "Gasfíter" },
  { "slug": "gasista", "name": "Gasista" }
]
```

**Errores**
- 400 `{ error: "q requerido" }` si falta `q`.
- 400 `{ error: "q demasiado corto" }` si `q.length < 2`.
- 400 `{ error: "kind inválido" }` si no es `trade|commune`.
- 200 `[]` si no hay match.

**Headers**
- `Cache-Control: public, max-age=60, s-maxage=60` — edge cache.

## Validaciones Zod

```ts
// src/lib/validators/autocomplete.ts
export const autocompleteParamsSchema = z.object({
  q: z.string().min(2).max(50),
  kind: z.enum(['trade', 'commune']),
})
```

## Componentes UI

- `src/components/search/Autocomplete.astro` (opcional en esta HU; la integración con `<input>` se puede hacer en HU-06.5).
- `src/components/search/AutocompleteInput.astro` — input con `<datalist>` o floating menu que consume `/autocomplete`.

## Flujo de interaccion (secuencial)

1. Usuario tipea en input de oficio/comuna.
2. Debounce 150 ms.
3. GET `/api/v1/search/autocomplete?q=<input>&kind=<tipo>`.
4. Server: Zod-valida, normaliza `q` con `normalizeAccents` (helper compartido con cliente).
5. Query: `SELECT slug, name FROM <kind_table> WHERE slug_normalized LIKE ? OR lower(name) LIKE ? LIMIT 10` con `? = lower(q) + '%'`.
6. Devuelve top 10.
7. Edge cache 60 s.
8. Front renderiza lista; al click, llena el campo del formulario principal.

## Capa de servicios

- `src/lib/utils/text.ts`:
  - `normalizeAccents(s: string): string` — NFD + remove diacritics + lowercase.
- `src/lib/services/search/autocomplete.ts`:
  - `autocompleteTrades(db, q): Promise<{slug, name}[]>`
  - `autocompleteCommunes(db, q): Promise<{slug, name}[]>`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/text.test.ts` | `normalizeAccents("Ñuñoa") === "nunoa"`; idempotente; vacío |
| Unit | `tests/unit/validators/autocomplete.test.ts` | Zod rechaza `q` corto, kind inválido |
| Integracion | `tests/integration/search/autocomplete.test.ts` | `?q=gas&kind=trade` retorna gasfiter+gasista; `?q=ñu&kind=commune` retorna nunoa; `?q=a` 400; `?q=nunoa` y `?q=Ñuñoa` retornan mismo resultado |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (`trades.slug`), REQ-02 (`communes.slug`).
- **Bloquea a:** HU-06.5 (URL state puede usar autocomplete para inicializar filtros).
- **Recursos compartidos:** `src/lib/utils/text.ts`.

## Riesgos tecnicos

- Riesgo: edge cache devuelve resultados viejos al agregar un oficio nuevo → Mitigación: TTL 60 s; documentado.
- Riesgo: la query `LIKE` con prefijo usa índice `idx_*_slug_normalized` pero la segunda condición `lower(name) LIKE ?` no → Mitigación: aceptar la búsqueda full-scan en `name` para los primeros 10 resultados; es barato con 100 filas máx.
- Riesgo: `normalizeAccents` server vs cliente divergen → Mitigación: misma implementación exacta, test compartido.
