# Diseño técnico — HU-12.5 — Sección de reseñas recibidas con respuesta

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

Reuso de `reviews` y `review_responses` (definidos en REQ-09).

```ts
// src/database/schema.ts (extracto referencial — definido en REQ-09)
export const reviews = sqliteTable('reviews', {
  // id, provider_id, author_user_id, rating, comment, status: 'visible' | 'hidden' | 'pending',
  // hidden_reason: text | null, created_at, updated_at
})

export const reviewResponses = sqliteTable('review_responses', {
  // id, review_id, provider_id, body, created_at, updated_at
})
```

### Migración Drizzle

No requiere migración si `status` y `hidden_reason` ya existen en `reviews` por REQ-09. Si faltan: archivo objetivo `src/database/migrations/NNNN_reviews_hidden_reason.sql`.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/reviews` | GET | sesión prestador | (ninguno) | `{ items: ReviewWithResponse[] }` (incluye `status` y `hidden_reason`) | 401, 403 |
| `/api/v1/providers/me/reviews/:id/response` | POST | sesión prestador | `{ body: string }` | `{ response: ReviewResponse }` (201) | 400, 401, 403, 404, 409 (ya tiene respuesta) |
| `/api/v1/providers/me/reviews/:id/response` | PATCH | sesión prestador | `{ body: string }` | `{ response: ReviewResponse }` | 400, 401, 403, 404 |

Tipo `ReviewWithResponse` (forma de respuesta):

```
{
  id, rating, comment, status, hidden_reason,
  author: { name, initials },
  created_at,
  response: { id, body, created_at } | null
}
```

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (pseudocódigo)
export const responseBodySchema = z.object({
  body: z.string().min(2).max(1000),
})
```

## Componentes UI

### Páginas Astro

- Sin página nueva. Se monta como sección dentro de `src/pages/dashboard-provider.astro` (HU-12.1) bajo el anchor `#resenas`.

### Componentes Astro reutilizables

- `src/components/dashboard/provider/ReviewsSection.astro` — props: `reviews: ReviewWithResponse[]`.
  - Mockup base: `mockups/profile.html:151-159` (UI a diseñar siguiendo este estilo, con título "Reseñas recibidas").
  - Islas requeridas: sí (`client:visible`) para envío de respuestas.
- `src/components/dashboard/provider/ReviewItem.astro` — props: `review: ReviewWithResponse`.
  - Mockup base: `mockups/profile.html:191-199` (template `review-item-template`).
  - Estados especiales: badge "Oculta por moderación" si `status === 'hidden'` con `hidden_reason` en tooltip.
  - Islas requeridas: sí (formulario de respuesta inline, sólo si `response === null`).
- `src/components/dashboard/provider/ResponseForm.astro` — props: `reviewId: string`, `existing?: string`.
  - Mockup base: UI a diseñar siguiendo el estilo del modal de Soporte (`mockups/dashboard-provider.html:407-440`) con textarea + botón.

## Flujo de interacción (secuencial)

1. Usuario navega a `#resenas` (link sidebar `mockups/dashboard-provider.html:61`).
2. `ReviewsSection.astro` renderiza la lista cargada desde `GET /api/v1/providers/me/reviews`.
3. Para cada reseña:
   - Si `status === 'hidden'`: se muestra atenuada con badge "Oculta por moderación" y motivo (`hidden_reason`).
   - Si `response === null`: se muestra el `ResponseForm` debajo del comentario.
   - Si `response !== null`: se muestra el cuerpo de la respuesta con etiqueta "Respuesta del prestador".
4. Submit del form envía `POST .../reviews/:id/response`.
5. Respuesta 201 → la fila reemplaza el form por el bloque de respuesta. 409 → mensaje "ya respondiste esta reseña".

## Capa de servicios

- `src/lib/services/reviews.service.ts`:
  - `listReviewsForProvider(env, providerId): Promise<ReviewWithResponse[]>` — join `reviews` + `review_responses`.
  - `createReviewResponse(env, providerId, reviewId, body): Promise<ReviewResponse>` — verifica ownership de la review y unicidad.
  - `updateReviewResponse(env, providerId, reviewId, body): Promise<ReviewResponse>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/reviews-response.test.ts` | Body mínimo/máximo. |
| Integración | `tests/integration/providers/reviews-received.test.ts` | GET incluye reseñas `hidden`, prestador A no ve reseñas de B, POST response con review ajena = 403, doble POST = 409. |
| E2E | `tests/e2e/provider-reviews-response.spec.ts` | Listar → responder reseña sin respuesta → ver respuesta. Reseña oculta muestra badge. |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1, REQ-09 (tabla `reviews` y endpoint base de respuestas).
- **Bloquea a:** —.
- **Recursos compartidos:** binding `DB`, helper compartido de moderación si existe.

## Riesgos técnicos

- Riesgo: filtrado por `provider_id` se omite en una query. Mitigación: helper `forProvider(query, providerId)` central para joins de reviews.
- Riesgo: respuestas a reseñas ocultas se muestran al público si la reseña vuelve a `visible`. Mitigación: comportamiento intencional — documentado en la UI con tooltip al guardar respuesta.
- Riesgo: textarea sin sanitización. Mitigación: guardar texto plano y escapar al render (Astro lo hace por defecto en `{var}`).
