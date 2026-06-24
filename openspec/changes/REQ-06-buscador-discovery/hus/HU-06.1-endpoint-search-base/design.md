# Diseno tecnico — HU-06.1 — Endpoint base de búsqueda por oficio

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No crea tablas. Lee:
- `providers` (HU-04.1) con JOIN a `users`, `trades`, `communes`.
- `verifications` (REQ-03) — chequea `status='approved'`.
- `services` (HU-05.1) — al menos un servicio activo.

## Contrato de API

### `GET /api/v1/search`

**Query params** (esta HU implementa los básicos; HU-06.2 y HU-06.3 extienden)
- `trade` (slug) opcional.
- `verified_only` (boolean) default `true`.
- `cursor` (opaque string) — HU-06.3.
- `limit` (int 1..50) default `20` — HU-06.3.
- `sort` (`relevance|rating_desc|recent`) default `relevance`.

**Response 200**
```json
{
  "items": [
    {
      "id": 42,
      "slug": "juan-perez-gasfiter-las-condes",
      "trade": { "slug": "gasfiter", "name": "Gasfíter" },
      "commune": { "slug": "las-condes", "name": "Las Condes" },
      "verified": true,
      "rating_avg": 4.8,
      "rating_count": 23,
      "photo_url": "https://media.example.com/avatars/42.jpg",
      "cover_url": null,
      "hourly_rate_clp": 25000,
      "services": [
        { "id": 7, "title": "Cambio de llave", "price_clp": 15000 }
      ]
    }
  ],
  "cursor": null,
  "total": 5
}
```

**Errores**
- 400 `{error: "params inválidos"}` si Zod falla.
- 500 sólo en errores no esperados.

## Validaciones Zod

```ts
// src/lib/validators/searchParams.ts
export const searchParamsSchema = z.object({
  trade: z.string().min(1).max(50).optional(),
  commune: z.string().min(1).max(50).optional(),         // HU-06.2
  minRating: z.coerce.number().min(0).max(5).optional(),  // HU-06.2
  verifiedOnly: z.coerce.boolean().default(true),
  cursor: z.string().optional(),                          // HU-06.3
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['relevance', 'rating_desc', 'recent']).default('relevance'),
})
```

## Componentes UI

Esta HU es backend. Los componentes que consumen la respuesta
(`SearchResults.astro`, `ResultCardGrid.astro`, `ResultCardList.astro`)
se entregan en HU-06.6.

## Flujo de interaccion (secuencial)

1. Visitante entra a home (`/`) o `/search`.
2. Front hace `GET /api/v1/search?trade=<slug>` con los params del estado de filtros (HU-06.5).
3. Handler Zod-valida params.
4. `queryBuilder.buildSearchQuery(db, params)` devuelve `{ sql, params }` y `countQuery` para total.
5. Ejecuta las dos queries en paralelo (`Promise.all`).
6. Mapea filas a shape canónico (joins resueltos a objetos anidados).
7. Devuelve 200 con `{items, cursor, total}`.

## Capa de servicios

- `src/lib/services/search/queryBuilder.ts` (firmas):
  - `buildSearchQuery(params: SearchParams): { items: SQL, count: SQL }`
  - `applyFilters(query, params): SQL` — helper interno, extensible.
  - Defaults: `verifiedOnly=true`, `status='published'`, al menos 1 servicio `active`.
- `src/lib/services/search/search.ts`:
  - `searchProviders(db, params): Promise<{ items: SearchItem[]; cursor: string | null; total: number }>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/search/queryBuilder.test.ts` | Builder genera SQL correcto para cada combinación de params; defaults aplicados |
| Unit | `tests/unit/search/search.test.ts` | Mapeo de filas a shape canónico |
| Integracion | `tests/integration/search/base.test.ts` | 50 prestadores seed; `?trade=gasfiter` retorna los esperados; `?trade=inexistente` retorna []; no verificados excluidos; drafts excluidos |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (`providers`), HU-04.2 (publicación), HU-04.5 (reindex), HU-05.1 (`services`), REQ-03 (verificación), REQ-02 (`communes`, `trades`).
- **Bloquea a:** HU-06.2 (filtros), HU-06.3 (paginación), HU-06.4 (autocomplete), HU-06.5 (URL state), HU-06.6 (grid/lista), HU-06.7 (suite aceptación).
- **Recursos compartidos:** `src/lib/services/search/queryBuilder.ts`.

## Riesgos tecnicos

- Riesgo: query con 4-5 JOINs se vuelve lenta con dataset grande → Mitigación: HU-06.7 mide p95; si supera 500 ms, optimizamos con vista materializada `provider_search_index` (preparada en HU-04.5 pero no usada todavía).
- Riesgo: el `verifiedOnly` por default oculta prestadores legítimos sin verificación (ej: recién registrados) → Mitigación: UX muestra mensaje "Mostrando sólo verificados" + link "Incluir todos".
- Riesgo: `total` con `COUNT(*)` agrega una query extra costosa → Mitigación: query count sólo se ejecuta si `cursor` es null (primera página); páginas siguientes omiten total.
