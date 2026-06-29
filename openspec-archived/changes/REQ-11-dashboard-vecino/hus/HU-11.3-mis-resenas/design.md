# Diseno tecnico — HU-11.3 — Listado de reseñas dejadas con CTA editar

**REQ padre:** REQ-11-dashboard-vecino

## Modelo de datos

No aplica. Esta HU sólo lee la tabla `reviews` (definida en REQ-09.1) y `providers`. No agrega columnas.

## Contrato de API

### `GET /api/v1/users/me/reviews`

- **Auth:** sesión de vecino requerida.
- **Query params:** `limit` (int, 1..50, default 20), `cursor` (opcional).
- **Response 200:**

```json
{
  "items": [
    {
      "id": 501,
      "rating": 5,
      "body": "Excelente trabajo, llegó a la hora.",
      "created_at": "2026-06-15T13:21:00Z",
      "editable": true,
      "has_provider_response": false,
      "provider": {
        "slug": "juan-perez",
        "name": "Juan Pérez",
        "photo_url": "https://.../juan.jpg"
      }
    }
  ],
  "next_cursor": null
}
```

- **Response 401** si no hay sesión.
- **Sort:** `created_at DESC, id DESC`.

## Validaciones Zod

```ts
// src/lib/validators/reviews-history.ts
import { z } from 'zod'

export const reviewsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
})
```

Helper de ventana (reutilizado por REQ-09 al editar):

```ts
// src/lib/services/reviews/canEditReview.ts
import type { Review } from '@/database/schema'

export const EDIT_WINDOW_DAYS = 7

export function canEditReview(
  review: { createdAt: Date; providerRespondedAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (review.providerRespondedAt) return false
  const ageMs = now.getTime() - review.createdAt.getTime()
  return ageMs <= EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000
}
```

## Componentes UI

- `src/components/dashboard/user/MyReviews.astro` — recibe `items: UserReviewItem[]` y renderiza la lista.
- `src/components/dashboard/user/ReviewRow.astro` — fila individual con estrellas (reuso del componente `StarRating.astro` de REQ-09), `body` truncado a 200 chars, fecha relativa, y CTA "Editar" (link a `/dashboard-user?tab=profile&edit=<id>` o ruta de edición REQ-09) si `editable=true`.
- Helper de fecha relativa `src/lib/utils/relativeDate.ts` (`formatRelative(date, now) → "hace 2 días"`).

## Flujo de interaccion (secuencial)

1. Vecino GET `/dashboard-user?tab=reviews` → SSR llama `GET /api/v1/users/me/reviews?limit=20`.
2. Servicio `listUserReviews(env, userId, opts)` ejecuta SQL:
   ```sql
   SELECT r.id, r.rating, r.body, r.created_at, r.provider_responded_at,
          p.slug, p.name, p.photo_url
   FROM reviews r
   JOIN providers p ON p.id = r.provider_id
   WHERE r.user_id = ?
   ORDER BY r.created_at DESC, r.id DESC
   LIMIT ?;
   ```
3. Para cada fila, llama `canEditReview({ createdAt, providerRespondedAt }, now)` y setea `editable` en el payload.
4. Vecino click "Editar" en fila con `editable=true` → navega a `GET /api/v1/reviews/<id>/edit` (REQ-09) o ruta de edición.

## Capa de servicios

```ts
// src/lib/services/reviews/list-user-reviews.ts (firmas)
export interface UserReviewItem {
  id: number
  rating: number
  body: string
  createdAt: Date
  editable: boolean
  hasProviderResponse: boolean
  provider: { slug: string; name: string; photoUrl: string | null }
}

export async function listUserReviews(
  env: Env,
  userId: number,
  opts: { limit: number; cursor?: string },
): Promise<{ items: UserReviewItem[]; nextCursor: string | null }>
```

Reuso del helper `encodeCursor` / `decodeCursor` de `src/lib/services/contact-events.ts` (mismo formato, lo extraemos a `src/lib/utils/cursor.ts` en T1).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/reviews/canEditReview.test.ts` | Dentro de ventana sin respuesta → true; con respuesta → false; fuera de ventana → false; borde 7 días |
| Unit | `tests/unit/reviews/formatRelative.test.ts` | "hace 2 días", "hace 9 horas", "recién" |
| Integracion | `tests/integration/users/my-reviews.test.ts` | 3 reseñas mixtas (dentro/fuera/respondida) → editable correcto; paginación |
| Integracion | `tests/integration/users/my-reviews-cross-user.test.ts` | Vecino B no ve reseñas de A; sin sesión → 401 |
| E2E | `tests/e2e/my-reviews.spec.ts` | Tab muestra filas; CTA "Editar" sólo donde corresponde |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01, REQ-02, REQ-09 (tabla `reviews`), HU-11.1 (route + tab).
- **Bloquea a:** — (REQ-09.2 edición de reseña depende del helper `canEditReview` que vive acá).
- **Recursos compartidos:** `src/lib/services/reviews/canEditReview.ts`, `src/lib/utils/cursor.ts`.

## Riesgos tecnicos

- Riesgo: reseñas con respuesta del prestador nunca editables → respuesta del prestador podría ser razonable → Mitigación: REQ-09 fija la política; la UI lo deja claro con texto "respondido por el prestador".
- Riesgo: cursor incompatible con el de HU-11.2 si cambia el formato → Mitigación: extraer `src/lib/utils/cursor.ts` con un único par encode/decode compartido.
- Riesgo: `body` puede contener HTML/scripts de reseñas maliciosas → Mitigación: escape en la capa de presentación (texto plano + saltos de línea), nunca `set:html`.
