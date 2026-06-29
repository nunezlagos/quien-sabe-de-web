# HU-11.3 — Listado de reseñas dejadas con CTA editar

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-11-dashboard-vecino
**Rama:** `feat/HU-11.3-mis-resenas`

## Tareas tecnicas

- [ ] **T1** Extraer `encodeCursor` / `decodeCursor` a `src/lib/utils/cursor.ts` (base64 JSON `{t, id}`). Actualizar imports de HU-11.2 si los usa.
- [ ] **T2** Helper `canEditReview` en `src/lib/services/reviews/canEditReview.ts` con `EDIT_WINDOW_DAYS = 7`.
- [ ] **T3** Helper `formatRelative(date, now)` en `src/lib/utils/relativeDate.ts` (devuelve "hace X minutos/horas/días").
- [ ] **T4** Servicio `listUserReviews(env, userId, opts)` en `src/lib/services/reviews/list-user-reviews.ts` con SQL del design.md y `canEditReview` por fila.
- [ ] **T5** Endpoint `src/pages/api/v1/users/me/reviews.ts` (`GET`) con guard de sesión y validación Zod `reviewsListQuerySchema`.
- [ ] **T6** Componente `src/components/dashboard/user/ReviewRow.astro` con props `{ item: UserReviewItem, editHref: string }`. CTA "Editar" sólo si `item.editable`.
- [ ] **T7** Componente `src/components/dashboard/user/MyReviews.astro` que itera `items` y delega a `ReviewRow`.
- [ ] **T8** Integrar `MyReviews` en el slot `reviews` del layout de HU-11.1.
- [ ] **T9** Tests:
  - [ ] `tests/unit/reviews/canEditReview.test.ts` — 4 casos: dentro sin respuesta, dentro con respuesta, fuera, borde 7d exacto.
  - [ ] `tests/unit/reviews/formatRelative.test.ts` — minutos, horas, días, futuro.
  - [ ] `tests/unit/utils/cursor.test.ts` — encode/decode simétrico; JSON malformado lanza.
  - [ ] `tests/integration/users/my-reviews.test.ts` — 3 reseñas mixtas → editable correcto; paginación con 12 reseñas → 10 + 2; orden DESC.
  - [ ] `tests/integration/users/my-reviews-cross-user.test.ts` — sin sesión → 401; vecino B no ve reseñas de A.
  - [ ] `tests/e2e/my-reviews.spec.ts` — tab reseñas → 3 filas; CTA editar visible sólo donde editable=true; click navega a edit.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/my-reviews.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: invertir el operador `<=` por `>=` en `canEditReview` → test "dentro de ventana" cae en rojo → restaurar
  - [ ] Sabotaje 2: borrar `WHERE r.user_id = ?` en `listUserReviews` → test cross-user cae en rojo → restaurar
  - [ ] Sabotaje 3: invertir `ORDER BY` a ASC → test E2E de orden cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews/` y `src/lib/utils/relativeDate.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
