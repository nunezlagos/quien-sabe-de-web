# HU-09.3 — Editar reseña dentro de 7 días

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.3-editar-resena-7-dias`

## Tareas técnicas

- [ ] **T1** Helper puro `src/lib/services/reviews/can-edit.ts`:
  - `canEditReview(review, nowMs, hasResponse): true | false | 'frozen_by_response'`.
  - Bordes exactos documentados: ventana `nowMs <= review.editedUntil`.
- [ ] **T2** Validador `reviewUpdateSchema` en `src/lib/validators/reviews.ts` con `.refine` que rechaza `{}`.
- [ ] **T3** Servicios en `src/lib/services/reviews.ts`:
  - `getReviewById(env, id): Promise<Review | null>`.
  - `hasResponseForReview(env, reviewId): Promise<boolean>`.
  - `updateReview(env, id, patch): Promise<Review>` — UPDATE dinámico: sólo setea keys presentes.
- [ ] **T4** Endpoint `src/pages/api/v1/reviews/[id].ts` (PATCH):
  - `requireSession` → 401.
  - `getReviewById` → 404 si null.
  - `review.userId !== session.user.id` → 403.
  - Validar body con `reviewUpdateSchema` → 422.
  - `hasResponseForReview` (sólo si pasa los chequeos anteriores).
  - `canEditReview(review, Date.now(), hasResponse)` → mapear a 200/403/409.
  - UPDATE y devolver fila actualizada.
- [ ] **T5** Tests:
  - [ ] `tests/unit/services/can-edit.test.ts` — recién creada → true; 3 días → true; 7d exacto → true; 7d + 1ms → false; oculta → false; con respuesta → 'frozen_by_response'.
  - [ ] `tests/unit/validators/reviews.test.ts` (extender) — `{}` falla; `{ rating: 4 }` OK; `{ body: 'hola' }` OK; `{ rating: 0 }` falla; `{ body: 'x'.repeat(1001) }` falla.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `updateReview` con `{ rating: 3 }` deja `body` intacto; con `{ body: 'nuevo' }` deja `rating` intacto; con ambos setea ambos.
  - [ ] `tests/integration/reviews/edit.test.ts` — seed reseña propia con 3d; PATCH → 200; seed 8d → 403; seed otro user → 403; seed con respuesta → 409; `{}` → 422; reseña oculta → 403; 404.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: cambiar `nowMs <= review.editedUntil` por `nowMs < review.editedUntil` → test "7d exacto → true" cae → restaurar
- [ ] Sabotaje 2: olvidar chequear `hasResponse` y siempre retornar `true` → test "con respuesta → 409" cae → restaurar
- [ ] Sabotaje 3: en el UPDATE usar `set(rating, body)` siempre (ignorar el patch parcial) → test "PATCH sólo rating no pisa body" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews/can-edit.ts`
- [ ] Type check verde
- [ ] Commit `feat: PATCH reseña con ventana 7d y freeze por respuesta` y push
