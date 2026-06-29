# Diseno tecnico — HU-09.4 — Respuesta única del prestador a una reseña

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

INSERT en `review_responses` (HU-09.1):

```sql
INSERT INTO review_responses (review_id, body, created_at)
VALUES (:reviewId, :body, :nowSec);
```

PK = `review_id` garantiza 1-a-1. La FK a `reviews(id)` con `ON DELETE CASCADE` limpia la respuesta si se borra la reseña.

## Contrato de API

| Endpoint | Método | Auth | Path | Request body | Response 201 | Errores |
|---|---|---|---|---|---|---|
| `/api/v1/reviews/:id/response` | POST | sesión prestador dueño | `id` numérico de review | `{ body: string 1..500 }` | `{ reviewId, body, createdAt }` | 401 (sin sesión), 403 (no es prestador dueño), 404 (reseña no existe), 409 (ya tiene respuesta), 422 (body > 500) |

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (extender)
export const reviewResponseCreateSchema = z.object({
  body: z.string().min(1).max(500),
});
```

## Componentes UI

No aplica en esta HU. La UI de "Responder" se materializa en REQ-12 (dashboard provider); esta HU es sólo el endpoint.

La HU-07.4 (lista de reseñas) ya incluye el join con `review_responses`, por lo que la respuesta se ve automáticamente al refrescar.

## Flujo de interaccion (secuencial)

1. Prestador autenticado envía `POST /api/v1/reviews/<id>/response` con `{ body }`.
2. Handler en `src/pages/api/v1/reviews/[id]/response.ts`:
   a. `requireProviderSession(Astro)` → 401 si falla; 403 si rol ≠ provider.
   b. `getReviewById(env, reviewId)` → 404 si null.
   c. `review.providerId !== session.providerId` → 403 `{ error: 'no es tu reseña' }`.
   d. `review.status === 'hidden'` → 403 `{ error: 'reseña oculta' }`.
   e. Validar body con `reviewResponseCreateSchema` → 422.
   f. INSERT en `review_responses`.
   g. Capturar `SQLITE_CONSTRAINT_PRIMARYKEY` → 409 `{ error: 'reseña ya tiene respuesta' }`.
   h. Devolver 201 con la fila creada.
3. Cliente recibe 201; HU-07.4 muestra la respuesta en el siguiente GET.

## Capa de servicios

- `src/lib/services/reviews.ts` (extender):
  - `createReviewResponse(env, reviewId, body): Promise<ReviewResponse>` — INSERT; mapea `SQLITE_CONSTRAINT_PRIMARYKEY` a `DuplicateResponseError`.
  - `hasResponseForReview(env, reviewId): Promise<boolean>` — ya existe (HU-09.3 lo usa).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/reviews.test.ts` (extender) | `reviewResponseCreateSchema`: body 1..500 OK; body 501 falla; body vacío falla |
| Unit | `tests/unit/services/reviews.test.ts` (extender) | `createReviewResponse` retorna fila; simular `SQLITE_CONSTRAINT_PRIMARYKEY` → `DuplicateResponseError` |
| Integración | `tests/integration/reviews/response.test.ts` | POST → 201; segunda → 409; otro prestador → 403; sin sesión → 401; body 501 → 422; reseña oculta → 403; reseña inexistente → 404; reseña con respuesta ya visible en GET público de HU-07.4 |

## Dependencias y secuencia

- **Bloqueado por:** HU-09.1 (schema `review_responses`), HU-09.2 (reseña creada).
- **Bloquea a:** HU-09.3 (freeze de edición depende de existencia de respuesta), HU-07.4 (join en listado público).
- **Recursos compartidos:** `requireProviderSession`, D1.

## Riesgos tecnicos

- Riesgo: el `session.providerId` puede ser null si la sesión es admin sin provider → Mitigación: chequeo explícito `if (session.providerId == null) → 403`.
- Riesgo: el prestador tiene cuenta pero su provider fue soft-deleted → Mitigación: HU-07.1 ya excluye providers con `status='deleted'`; si el endpoint de reviews se llama igual, el chequeo `review.provider_id === session.providerId` sigue funcionando.
- Riesgo: el body con 500 chars justo pasa el Zod pero el CHECK de DB es `<= 500` → Mitigación: CHECK acepta 500 inclusive; documentar.
- Riesgo: el INSERT falla por FK si la reseña fue borrada entre `getReviewById` e INSERT → Mitigación: capturar `SQLITE_CONSTRAINT_FOREIGNKEY` y mapear a 404.
