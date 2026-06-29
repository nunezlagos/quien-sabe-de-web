# Diseno tecnico — HU-07.4 — Sección de reseñas con promedio y paginación

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

Depende del schema `reviews` (HU-09.1). Esta HU sólo lee, no escribe.

Schema mínimo esperado (definido en HU-09.1, referenciado acá):

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  hidden_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  edited_until INTEGER,
  UNIQUE(user_id, provider_id)
);
CREATE INDEX idx_reviews_provider_visible_created
  ON reviews(provider_id, status, created_at DESC, id DESC);
```

## Contrato de API

| Endpoint | Método | Auth | Path | Query | Response 200 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/providers/:id/reviews` | GET | público | `id` numérico del provider | `limit?: int (default 10, max 50)`, `cursor?: base64url` | `{ items: PublicReview[], cursor: string \| null, ratingAvg: number \| null, total: number }` | 404 (provider no existe), 400 (cursor malformado / limit fuera de rango) |

DTO `PublicReview`:

```ts
type PublicReview = {
  id: number;
  rating: number;          // 1-5
  body: string | null;
  authorName: string;       // "Juan P." (primer nombre + inicial)
  createdAt: string;        // ISO 8601
  response: {
    body: string;
    createdAt: string;
  } | null;                // HU-09.4
};
```

Query SQL (pseudo):

```sql
-- items + total
SELECT id, rating, body, user_id, created_at,
       (SELECT body, created_at FROM review_responses WHERE review_id = r.id) AS response
FROM reviews r
WHERE provider_id = :pid AND status = 'visible'
  AND (cursor IS NULL OR (created_at, id) < (:cursor_ts, :cursor_id))
ORDER BY created_at DESC, id DESC
LIMIT :limit + 1; -- +1 para detectar hasMore

-- total + ratingAvg (sólo primera página, para mantener estable)
SELECT COUNT(*) AS total,
       AVG(rating) AS rating_avg
FROM reviews
WHERE provider_id = :pid AND status = 'visible';
```

Si `cursor` está presente, la segunda query de total/avg se omite (se devuelve el de la primera página).

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (firmas)
export const reviewsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().min(1).optional(),
});

export const publicReviewSchema = z.object({
  id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  body: z.string().nullable(),
  authorName: z.string().min(1).max(50),
  createdAt: z.string().datetime(),
  response: z.object({
    body: z.string(),
    createdAt: z.string().datetime(),
  }).nullable(),
});
```

## Componentes UI

### Paginas y endpoints

- `src/pages/api/v1/providers/[id]/reviews.ts` — endpoint GET.
- `src/pages/p/[slug].astro` (HU-07.2) añade SSR fetch a `/api/v1/providers/<id>/reviews?limit=10`.

### Componentes Astro

- `src/components/providers/ReviewsSection.astro`:
  - Props: `reviews: PublicReview[]`, `ratingAvg: number | null`, `total: number`, `nextCursor: string | null`.
  - Header con icono `ri-star-line text-primary` y título "Opiniones" (`mockups/profile.html:153-154`).
  - Summary: `<div class="flex items-center gap-2 mb-4">` con `renderStars(ratingAvg)` y texto `ratingAvg.toFixed(1) · total trabajos`.
  - Si `reviews.length === 0` → empty state (`mockups/profile.html:201-203`).
  - Lista `<div class="space-y-3">` con un `<div class="bg-gray-50 p-4 rounded-xl">` por review:
    - Header: nombre + estrellas.
    - Body: `<p class="text-gray-600 text-sm">{body}</p>`.
    - Si `response !== null` → bloque nested `<div class="mt-2 pl-4 border-l-2 border-primary/30 text-xs text-gray-500">` con texto "Respuesta del prestador:" + body.
  - Botón "Ver más" si `nextCursor !== null`. Llama a fetch cliente con cursor y concatena.
- Helper `src/lib/utils/cursor.ts` con `encodeCursor(ts: number, id: number): string` y `decodeCursor(s: string): { ts: number, id: number }`.

### Islas

- Botón "Ver más" requiere una isla pequeña (1 archivo) que concatene reviews al DOM. Sin framework adicional: `<script>` inline con `fetch` + `insertAdjacentHTML`.

## Flujo de interaccion (secuencial)

1. SSR de `/p/<slug>` carga perfil (HU-07.1) y reseñas (este endpoint).
2. `PublicProfile.astro` pasa `reviews, ratingAvg, total, nextCursor` a `<ReviewsSection>`.
3. HTML inicial muestra las primeras 10 reseñas + botón "Ver más" si aplica.
4. Cliente hace clic en "Ver más" → fetch a `?cursor=<x>` → concatena HTML.

## Capa de servicios

- `src/lib/services/reviews.ts`:
  - `listProviderReviews(env, providerId, { limit, cursor? }): Promise<{ items, cursor, ratingAvg, total }>` — orquesta queries + decode cursor.
  - `getProviderRatingStats(env, providerId): Promise<{ avg: number | null, count: number }>` — usado acá y por HU-07.1.
- `src/lib/utils/cursor.ts` — helpers de cursor (reutilizable).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/cursor.test.ts` | `encodeCursor` + `decodeCursor` roundtrip; cursor malformado lanza error |
| Unit | `tests/unit/validators/reviews.test.ts` | `reviewsListQuerySchema`: limit default, limit > 50 falla, cursor opcional |
| Unit | `tests/unit/components/reviews-section.test.ts` | Render de 3 reseñas; empty state con `[]`; respuesta anidada cuando existe; "Ver más" visible sólo si `nextCursor` |
| Integración | `tests/integration/providers/reviews-list.test.ts` | 15 reseñas seed; GET `?limit=10` → 10 items + cursor; segunda llamada con cursor → 5 items sin overlap; reseña `hidden` no aparece; reseñas con respuesta se serializan; cursor inválido → 400; provider inexistente → 404 |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema `reviews` + índice).
- **Bloquea a:** HU-09.5 (cache del promedio se basa en el contrato de respuesta).
- **Recursos compartidos:** binding D1, helper de cursor.

## Riesgos tecnicos

- Riesgo: reseñas con `body` de 5000 chars rompen el SSR → Mitigación: HU-09.2 valida `body <= 1000` chars en el insert; acá sólo se trunca visualmente a 280 con CSS (`line-clamp-4`).
- Riesgo: el join con `review_responses` para cada fila es N+1 → Mitigación: usar `LEFT JOIN review_responses` en una sola query.
- Riesgo: `AVG(rating)` con miles de filas es lento → Mitigación: índice `(provider_id, status)` cubre el WHERE; en REQ futuro se materializa.
- Riesgo: el cursor no es estable si dos reseñas tienen mismo `created_at` → Mitigación: cursor incluye `id DESC` como tiebreaker (índice también).
