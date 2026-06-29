# HU-12.5 — Sección de reseñas recibidas con respuesta

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.5-seccion-resenas-respuesta`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/reviews.service.ts` con `listReviewsForProvider` (join reviews + review_responses + users para `author.name/initials`), `createReviewResponse`, `updateReviewResponse`. Verifica ownership de review en todas las mutaciones.
- [ ] **T2** Validador `responseBodySchema` en `src/lib/validators/reviews.ts` (Zod, body 2..1000 chars).
- [ ] **T3** Endpoints (existentes en REQ-09; verificar que existan o crearlos):
  - `src/pages/api/v1/providers/me/reviews.ts` (GET)
  - `src/pages/api/v1/providers/me/reviews/[id]/response.ts` (POST y PATCH)
- [ ] **T4** Componente `src/components/dashboard/provider/ReviewsSection.astro` con prop `reviews`. Mockup base `mockups/profile.html:151-159`. Isla `client:visible`.
- [ ] **T5** Componente `src/components/dashboard/provider/ReviewItem.astro` con prop `review`. Mockup `mockups/profile.html:191-199`. Badge "Oculta por moderación" con tooltip si `status === 'hidden'`.
- [ ] **T6** Componente `src/components/dashboard/provider/ResponseForm.astro` con props `{reviewId, existing?}`. Textarea + botón submit. Isla.
- [ ] **T7** Integrar `ReviewsSection` en `dashboard-provider.astro` bajo anchor `#resenas`. Carga inicial SSR; refresca tras submit.
- [ ] **T8** Helper `forProvider(query, providerId)` central para joins de reviews — usado por `listReviewsForProvider` y eventualmente por REQ-09. Vive en `src/lib/services/reviews.service.ts` export.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/reviews-response.test.ts` — body mínimo/máximo, body vacío rechazado.
  - [ ] `tests/integration/providers/reviews-received.test.ts` — GET incluye reseñas `hidden`, prestador A no ve reseñas de B, POST response con review ajena = 403, doble POST = 409.
  - [ ] `tests/e2e/provider-reviews-response.spec.ts` — listar → responder reseña sin respuesta → ver respuesta. Reseña oculta muestra badge.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `listReviewsForProvider`, omitir filtro `provider_id` → test integración con prestador B ve reseñas de A → restaurar
- [ ] Sabotaje 2: en `createReviewResponse`, no chequear unicidad → doble POST crea dos respuestas, test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: sección reseñas + respuestas prestador` y push