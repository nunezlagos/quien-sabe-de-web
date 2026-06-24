# HU-09.4 — Respuesta única del prestador a una reseña

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.4-respuesta-prestador`

## Tareas técnicas

- [ ] **T1** Validador `reviewResponseCreateSchema` en `src/lib/validators/reviews.ts`.
- [ ] **T2** Servicio `createReviewResponse(env, reviewId, body): Promise<ReviewResponse>` en `src/lib/services/reviews.ts`:
  - INSERT en `review_responses`.
  - Capturar errores SQLite: `SQLITE_CONSTRAINT_PRIMARYKEY` → `throw new DuplicateResponseError(...)`; `SQLITE_CONSTRAINT_FOREIGNKEY` → `throw new ReviewNotFoundError(...)`.
- [ ] **T3** Endpoint `src/pages/api/v1/reviews/[id]/response.ts` (POST):
  - `requireProviderSession(Astro)` → 401 / 403 según rol.
  - `if (session.providerId == null) → 403`.
  - `getReviewById` → 404 si null.
  - `review.providerId !== session.providerId` → 403 `{ error: 'no es tu reseña' }`.
  - `review.status === 'hidden'` → 403.
  - Validar body con `reviewResponseCreateSchema` → 422.
  - Try `createReviewResponse`; catch `DuplicateResponseError` → 409; catch `ReviewNotFoundError` → 404.
  - `successResponse(response, 201)`.
- [ ] **T4** Confirmar que HU-07.4 (`listProviderReviews`) ya hace `LEFT JOIN review_responses` y serializa `response: { body, createdAt } | null`. Si no lo hace, agregarlo en este PR (cambio compatible).
- [ ] **T5** Tests:
  - [ ] `tests/unit/validators/reviews.test.ts` (extender) — body 500 OK; 501 falla; vacío falla.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `createReviewResponse` happy path retorna fila; simular error `SQLITE_CONSTRAINT_PRIMARYKEY` → `DuplicateResponseError`; simular `SQLITE_CONSTRAINT_FOREIGNKEY` → `ReviewNotFoundError`.
  - [ ] `tests/integration/reviews/response.test.ts` — POST con sesión prestador dueño → 201; segunda POST → 409; POST de prestador B a reseña de A → 403; sin sesión → 401; body 501 → 422; reseña oculta → 403; reseña inexistente → 404; verificar que GET público (HU-07.4) ahora incluye `response`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `createReviewResponse`, no capturar `SQLITE_CONSTRAINT_PRIMARYKEY` y propagar el error genérico → test "segunda respuesta → 409" cae (devuelve 500) → restaurar
- [ ] Sabotaje 2: cambiar `review.providerId !== session.providerId` por `review.providerId === session.providerId` (invertido) → test "prestador B → 403" cae → restaurar
- [ ] Sabotaje 3: olvidar el `LEFT JOIN review_responses` en `listProviderReviews` → test "respuesta visible en GET público" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` (rama response)
- [ ] Type check verde
- [ ] Commit `feat: POST respuesta del prestador (1-a-1 con reseña)` y push
