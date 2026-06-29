# HU-09.2 — Crear reseña con gate por contact_event

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.2-crear-resena`

## Tareas técnicas

- [ ] **T1** Validador `reviewCreateSchema` en `src/lib/validators/reviews.ts`.
- [ ] **T2** Servicio `hasContactedProvider(env, userId, providerId): Promise<boolean>` en `src/lib/services/reviews.ts`:
  - `SELECT 1 FROM contact_events WHERE user_id = ? AND provider_id = ? LIMIT 1`.
  - `return rows.length > 0`.
- [ ] **T3** Servicio `createReview(env, input): Promise<PublicReview>`:
  - `const now = Date.now(); const editedUntil = now + 7 * 86400 * 1000;`
  - INSERT en `reviews` con `status: 'visible'`, `createdAt: new Date(now)`, `editedUntil: new Date(editedUntil)`.
  - Capturar `UNIQUE constraint failed: reviews.user_id, reviews.provider_id` → lanzar `DuplicateReviewError`.
  - Retornar la fila insertada mapeada a `PublicReview`.
- [ ] **T4** Endpoint `POST /api/v1/providers/[id]/reviews` en `src/pages/api/v1/providers/[id]/reviews.ts` (mismo archivo que el GET de HU-07.4, discriminado por método):
  - `requireSession(Astro)` → 401.
  - `Astro.locals.session.user.role !== 'user'` → 403 `{ error: 'rol no autorizado' }`.
  - Validar `providerId` → 404 si provider no existe.
  - Validar body con `reviewCreateSchema` → 422.
  - `hasContactedProvider` → 403 `{ error: 'debe contactar antes de reseñar' }`.
  - Try `createReview`; catch `DuplicateReviewError` → 409 `{ error: 'ya reseñó a este prestador' }`.
  - `successResponse(review, 201)`.
- [ ] **T5** Tests:
  - [ ] `tests/unit/validators/reviews.test.ts` (extender) — `reviewCreateSchema`: rating 1-5 OK, 0 falla, 6 falla; body 1001 chars falla; body ausente OK.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `hasContactedProvider`: con fila → true; sin fila → false; múltiples filas → true.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `createReview` calcula `edited_until = now + 7d` con tolerancia ±1s.
  - [ ] `tests/integration/reviews/create.test.ts` — seed user, provider, contact_event; POST → 201 con shape correcto; sin contact_event → 403; reseña duplicada → 409; body 1001 chars → 422; sin sesión → 401; sesión rol provider → 403; provider inexistente → 404; `edited_until` correcto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: comentar la línea `hasContactedProvider` → test "POST sin contact_event → 403" cae → restaurar
- [ ] Sabotaje 2: cambiar `editedUntil = now + 7 * 86400 * 1000` por `now` (sin 7 días) → test "edited_until correcto" cae → restaurar
- [ ] Sabotaje 3: cambiar el orden de chequeo `role === 'user'` por `role !== 'admin'` (deja pasar providers) → test "rol provider → 403" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` (ramas nuevas)
- [ ] Type check verde
- [ ] Commit `feat: POST /reviews con gate de contact_event y UNIQUE` y push
