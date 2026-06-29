# Diseno tecnico — HU-06.2 — Filtros combinables (comuna, rating, verified)

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No agrega tablas. Lee:
- `communes` (REQ-02) — para resolver `?commune=<slug>`.
- `reviews` (REQ-09) — subquery agregada para `rating_avg` y `rating_count`. Asume `reviews.status IN ('visible')` y que la tabla ya existe con índice por `provider_id`.

## Contrato de API

Extiende `GET /api/v1/search` (de HU-06.1). Acepta nuevos query params:

### Query params adicionales
- `commune` (slug) opcional — filtra por `communes.slug = ?`.
- `min_rating` (float 0..5) opcional — filtra por `rating_avg >= ?`.
- `verified_only` (boolean) — ya estaba en HU-06.1, esta HU formaliza el override `false`.

### Cambios en response
El campo `rating_avg` y `rating_count` de cada item (ya en HU-06.1) ahora se calculan correctamente con la subquery agregada. Sin cambios en shape.

## Validaciones Zod

```ts
// src/lib/validators/searchParams.ts (extiende HU-06.1)
export const searchParamsSchema = z.object({
  trade: z.string().min(1).max(50).optional(),
  commune: z.string().min(1).max(50).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verifiedOnly: z.coerce.boolean().default(true),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['relevance', 'rating_desc', 'recent']).default('relevance'),
})
```

## Componentes UI

Esta HU es backend. Los componentes que traducen inputs a query
params (`<input name="min_rating">`, `<select name="commune">`) se
entregan en HU-06.5 (URL state).

## Flujo de interaccion (secuencial)

1. Front hace `GET /api/v1/search?trade=gasfiter&commune=las-condes&min_rating=4`.
2. Handler Zod-valida (HU-06.1 schema extendido).
3. `queryBuilder.buildSearchQuery(params)` agrega al WHERE:
   - `communes.slug = ?` si `params.commune`.
   - `rating_subquery.avg >= ?` si `params.minRating > 0`.
   - `verifiedOnly` ya estaba en HU-06.1, esta HU sólo confirma el override.
4. Subquery `rating_avg`:
   ```sql
   LEFT JOIN (
     SELECT provider_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
     FROM reviews
     WHERE status = 'visible'
     GROUP BY provider_id
   ) ratings ON ratings.provider_id = providers.id
   ```
5. Ejecuta y devuelve items con `rating_avg` y `rating_count` poblados.

## Capa de servicios

- `src/lib/services/search/queryBuilder.ts` (extiende HU-06.1):
  - `applyFilters(sql, params)` agrega condiciones según presencia de cada filtro.
  - Nueva rama: `commune` → `WHERE communes.slug = ?`.
  - Nueva rama: `minRating > 0` → `WHERE ratings.rating_avg >= ?` (con `LEFT JOIN ratings` siempre presente para que `rating_avg` esté disponible aunque no se filtre).
- `src/lib/services/search/search.ts` (extiende HU-06.1): sin cambios funcionales; el builder ya incluye el JOIN.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/search/queryBuilder.test.ts` (extiende) | SQL contiene `communes.slug = ?` cuando `params.commune`; contiene `ratings.rating_avg >= ?` cuando `minRating > 0`; no contiene cuando es null/0 |
| Integracion | `tests/integration/search/filters.test.ts` | Cada filtro solo; combinaciones AND (commune + rating + verified); `verified_only=false` incluye no verificados; `min_rating=0` no filtra |
| Integracion | `tests/integration/search/empty-result.test.ts` | Combinación que no matchea → `{items: [], total: 0}` |

## Dependencias y secuencia

- **Bloqueado por:** HU-06.1 (endpoint base), REQ-02 (`communes`), REQ-09 (`reviews`, schema asumido).
- **Bloquea a:** HU-06.5 (URL state mapea los inputs a estos params), HU-06.7 (suite de aceptación cubre combinaciones).
- **Recursos compartidos:** `queryBuilder.ts`.

## Riesgos tecnicos

- Riesgo: `LEFT JOIN ratings` siempre presente infla todas las queries de HU-06.1 aunque no se use rating → Mitigación: el JOIN es barato (reviews indexado por provider_id); alternativa es join condicional más compleja que no vale la pena.
- Riesgo: D1 no soporta ciertas funciones de ventana o subqueries correlacionadas complejas → Mitigación: la subquery es un `GROUP BY` simple, soportado por SQLite/D1; verificado por test de integración.
- Riesgo: `commune` por slug no distingue entre proveedor directo y cobertura de servicio → Mitigación: documentar en design que esta HU filtra por `commune_id` del provider (HU-06.2+ puede extender a `service_coverage`).
