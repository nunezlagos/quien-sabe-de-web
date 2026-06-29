# Diseno tecnico — HU-09.5 — Promedio público y filtro por rating

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

No introduce tablas. Reutiliza `reviews` (HU-09.1) con índice `idx_reviews_provider_visible_created` que cubre la query.

Query SQL principal:

```sql
SELECT
  AVG(rating) AS rating_avg,
  COUNT(*) AS rating_count
FROM reviews
WHERE provider_id = :pid AND status = 'visible';
```

## Contrato de API

No añade endpoints. Cambia el DTO de HU-07.1:

- `ratingAvg: number | null` (antes era opcional; ahora se garantiza calculo on-read).
- `reviewsCount: number` (antes era el count sin filtrar; ahora es count de visibles).

El endpoint de HU-07.4 (`/api/v1/providers/:id/reviews`) también retorna `ratingAvg` en la primera página (ya documentado).

Filtro en el buscador (REQ-06): el endpoint `GET /api/v1/providers/search?min_rating=4` aplica el mismo AVG como subquery y filtra `WHERE avg >= :min_rating`. Esta HU sólo deja listo el helper reutilizable; el endpoint de search es REQ-06.

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (extender)
export const ratingStatsSchema = z.object({
  avg: z.number().min(0).max(5).nullable(),
  count: z.number().int().nonnegative(),
});
```

## Componentes UI

No aplica. La UI del promedio ya la renderiza HU-07.1 vía `PublicProvider.ratingAvg`. El filtro de rating en buscador se materializa en REQ-06.

## Flujo de interaccion (secuencial)

1. GET `/api/v1/providers/<slug>` (HU-07.1).
2. `getPublicProviderByIdOrSlug` invoca `getProviderRatingStats(env, providerId)`.
3. `getProviderRatingStats` ejecuta la query AVG.
4. Si `count === 0` → retorna `{ avg: null, count: 0 }`.
5. Sino → retorna `{ avg: parseFloat(row.rating_avg.toFixed(2)), count: row.rating_count }`.
6. DTO se serializa con `ratingAvg` y `reviewsCount`.
7. Edge cache TTL 60s (HU-07.6) cachea la respuesta.

Tras INSERT/UPDATE en `reviews` (vía HU-09.2 o HU-09.6), el siguiente GET al endpoint refleja el nuevo promedio tras el TTL.

## Capa de servicios

`src/lib/services/reviews.ts` (extender, función ya implementada en HU-09.1):

```ts
export async function getProviderRatingStats(env, providerId): Promise<{ avg: number | null, count: number }> {
  const result = await db
    .select({ avg: sql<number | null>`AVG(rating)`, count: sql<number>`COUNT(*)` })
    .from(reviews)
    .where(and(eq(reviews.providerId, providerId), eq(reviews.status, 'visible')))
    .get();
  if (!result || result.count === 0) return { avg: null, count: 0 };
  return { avg: parseFloat(Number(result.avg).toFixed(2)), count: result.count };
}
```

Exporta también `computeMinRatingFilter(subquerySql)` para que REQ-06 reuse la subquery.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/reviews.test.ts` (extender) | `getProviderRatingStats` con 0 reseñas → `{ avg: null, count: 0 }`; con reseñas `[5,4,5,4]` → `{ avg: 4.5, count: 4 }`; con reseñas `[1]` ocultas → cuenta 0 |
| Integración | `tests/integration/reviews/avg.test.ts` | seed 5 reseñas (4 visibles, 1 hidden); `getProviderRatingStats` retorna avg=4.5, count=4; ocultar la 5ta cambia avg a 4.0; tras INSERT de nueva reseña, siguiente GET refleja el cambio |
| Integración | `tests/integration/providers/public-get.test.ts` (extender HU-07.1) | GET perfil incluye `ratingAvg` correcto en DTO; reseñas ocultas no afectan el promedio expuesto |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema), HU-07.1 (endpoint que expone), HU-09.6 (ocultar reseñas para verificar el filtro).
- **Bloquea a:** REQ-06 (filtro de búsqueda), HU-07.4 (lista de reseñas).
- **Recursos compartidos:** `getProviderRatingStats` ya implementado en HU-09.1.

## Riesgos tecnicos

- Riesgo: `parseFloat(Number(avg).toFixed(2))` pierde precisión en reseñas con muchos decimales → Mitigación: `toFixed(2)` trunca a 2 decimales; aceptable.
- Riesgo: race entre INSERT y AVG (read skew) → Mitigación: D1 usa WAL; en la práctica, el promedio refleja "cualquier momento entre el inicio y fin de la query"; aceptable.
- Riesgo: el índice no se usa porque el planner prefiere table scan con pocas filas → Mitigación: `EXPLAIN QUERY PLAN` confirma el uso cuando `count > 100`.
- Riesgo: el helper `computeMinRatingFilter` no se reutiliza en REQ-06 → Mitigación: HU-09.5 lo deja exportado y documentado; REQ-06 lo importa (verificable en PR review).
