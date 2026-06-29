# Diseno tecnico — HU-09.3 — Editar reseña dentro de 7 días

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

UPDATE sobre `reviews` (HU-09.1):

```sql
UPDATE reviews
SET rating = :rating, body = :body
WHERE id = :id;
```

No se modifica `edited_until` (la ventana es fija desde la creación). El UPDATE no toca `status` (ocultar es HU-09.6).

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 200 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/reviews/:id` | PATCH | sesión user autora | `id` numérico | `{ rating?: 1-5, body?: string <= 1000 }` | `{ id, rating, body, status, createdAt, editedUntil }` | 401 (sin sesión), 403 (no es autora), 403 (fuera de ventana), 409 (respuesta del prestador), 404 (reseña no existe), 422 (Zod) |

El body es parcial: se puede editar sólo `rating`, sólo `body`, o ambos. Si se envía body vacío `{}` → 422 (no hay nada que editar).

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (extender)
export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  body: z.string().min(1).max(1000).optional(),
}).refine(
  (v) => v.rating !== undefined || v.body !== undefined,
  { message: 'debe incluir al menos rating o body' }
);
```

## Componentes UI

No aplica. La UI de edición se materializa en REQ-11 (dashboard user); esta HU es sólo el endpoint.

## Flujo de interaccion (secuencial)

1. Cliente autenticado envía `PATCH /api/v1/reviews/<id>` con `{ rating?, body? }`.
2. Handler en `src/pages/api/v1/reviews/[id].ts`:
   a. `requireSession(Astro)` → 401.
   b. `SELECT * FROM reviews WHERE id = ?` → 404 si no existe.
   c. `review.userId !== session.user.id` → 403 `{ error: 'no es tu reseña' }`.
   d. Validar body con `reviewUpdateSchema` → 422.
   e. `canEditReview(review, now, hasResponse)`:
      - Si `review.status === 'hidden'` → `false`.
      - Si `now > review.editedUntil` → `false` (fuera de ventana).
      - Si `hasResponse === true` → `'frozen_by_response'`.
      - Else → `true`.
   f. Mapear resultado:
      - `false` por status → 403 `{ error: 'reseña oculta, no editable' }`.
      - `false` por ventana → 403 `{ error: 'edición fuera de ventana' }`.
      - `'frozen_by_response'` → 409 `{ error: 'edición bloqueada por respuesta' }`.
      - `true` → UPDATE con sólo los campos provistos; retornar fila actualizada.
3. Cliente recibe 200; el listado en HU-07.4 se actualiza al recargar.

## Capa de servicios

- `src/lib/services/reviews.ts`:
  - `getReviewById(env, id): Promise<Review | null>`.
  - `hasResponseForReview(env, reviewId): Promise<boolean>` — `SELECT 1 FROM review_responses WHERE review_id = ? LIMIT 1`.
  - `updateReview(env, id, patch: { rating?, body? }): Promise<Review>`.
- `src/lib/services/reviews/can-edit.ts` (puro):
  - `canEditReview(review: Review, nowMs: number, hasResponse: boolean): true | false | 'frozen_by_response'`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/can-edit.test.ts` | `canEditReview`: recién creada → true; 3 días → true; 8 días → false; oculta → false; con respuesta → 'frozen_by_response'; borde (7d exacto) → true; 7d + 1ms → false |
| Unit | `tests/unit/validators/reviews.test.ts` (extender) | `reviewUpdateSchema`: {} falla; { rating } OK; { body } OK; { rating: 0 } falla; { body: 'x'.repeat(1001) } falla |
| Integración | `tests/integration/reviews/edit.test.ts` | PATCH dentro de ventana → 200; fuera de ventana → 403; otro user → 403; con respuesta → 409; {} → 422; rating 0 → 422; body 1001 → 422; reseña oculta → 403; reseña inexistente → 404 |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema), HU-09.2 (POST crea la reseña), HU-09.4 (existencia de respuesta para el 409).
- **Bloquea a:** ninguna directa.
- **Recursos compartidos:** `requireSession`.

## Riesgos tecnicos

- Riesgo: el reloj del servidor cambia entre check y UPDATE → Mitigación: `Date.now()` se lee una vez al inicio del handler.
- Riesgo: la respuesta se crea entre check y UPDATE (race) → Mitigación: documentar; la operación es lo suficientemente rara para aceptar la race. Una alternativa sería SELECT + UPDATE en transacción con `BEGIN IMMEDIATE` (D1 SQLite soporta).
- Riesgo: si `canEditReview` se mete en otro archivo, se pierde el coverage del helper puro → Mitigación: test unit dedicado con casos límite.
- Riesgo: edición parcial no documentada en API → Mitigación: `reviewUpdateSchema` rechaza `{}` explícitamente; OpenAPI-style doc se agrega en el README del PR.
