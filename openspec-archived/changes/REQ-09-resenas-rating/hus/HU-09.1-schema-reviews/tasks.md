# HU-09.1 — Schema reviews + review_responses

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.1-schema-reviews`

## Tareas técnicas

- [ ] **T1** Editar `src/database/schema.ts` agregando `reviews` y `reviewResponses` con tipos, FK, índices y UNIQUE según `design.md`.
- [ ] **T2** Generar migración con `docker exec quien-sabe-app bun run db:generate`. Verificar el SQL generado.
- [ ] **T3** Editar la migración SQL manualmente para agregar los CHECK constraints que `drizzle-kit` no emite:
  - `CHECK (rating BETWEEN 1 AND 5)`
  - `CHECK (status IN ('visible','hidden'))`
  - `CHECK (length(body) <= 1000)`
  - `CHECK (length(body) <= 500)` y `CHECK (length(body) >= 1)` en `review_responses.body`.
- [ ] **T4** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar que las tablas existen.
- [ ] **T5** Stubs en `src/lib/services/reviews.ts`:
  - `getProviderRatingStats(env, providerId): Promise<{ avg: number | null, count: number }>` — implementación completa (necesaria para HU-07.4 y HU-07.1).
  - Firmas vacías con `throw new Error('not implemented yet')` para `listProviderReviews`, `createReview`, `updateReview`, `createReviewResponse`, `hideReview` (las completan HU-07.4 y siguientes).
- [ ] **T6** Validadores en `src/lib/validators/reviews.ts`: `reviewRatingSchema`, `reviewStatusSchema`, `reviewBodySchema`, `reviewInsertSchema`, `reviewResponseInsertSchema`.
- [ ] **T7** Tests:
  - [ ] `tests/integration/reviews/schema.test.ts` — `bun:sqlite` in-memory con schema Drizzle; INSERT válido; CHECK rating rechaza 0, 6; CHECK status rechaza 'otro'; CHECK body rechaza 1001 chars; UNIQUE(user_id, provider_id) rechaza duplicado; FK cascade borra al borrar provider.
  - [ ] `tests/integration/reviews/schema.test.ts` — `EXPLAIN QUERY PLAN SELECT * FROM reviews WHERE provider_id=1 AND status='visible' ORDER BY created_at DESC LIMIT 11` retorna plan que menciona `idx_reviews_provider_visible_created`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: cambiar `CHECK (rating BETWEEN 1 AND 5)` por `CHECK (rating BETWEEN 0 AND 5)` → test "rating=6 falla" cae → restaurar
- [ ] Sabotaje 2: comentar `UNIQUE (user_id, provider_id)` → test "duplicado falla" cae → restaurar
- [ ] Sabotaje 3: cambiar `ON DELETE CASCADE` por `ON DELETE SET NULL` en FK a providers → test "FK cascade borra reseñas al borrar provider" cae (las reseñas quedan con provider_id NULL) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` (sólo la función `getProviderRatingStats` implementada)
- [ ] Type check verde
- [ ] Commit `feat: schema reviews + review_responses con CHECK y UNIQUE` y push
