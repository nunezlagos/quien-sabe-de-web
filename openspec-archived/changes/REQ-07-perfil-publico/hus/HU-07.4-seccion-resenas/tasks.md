# HU-07.4 — Sección de reseñas con promedio y paginación

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.4-seccion-resenas`

## Tareas técnicas

- [ ] **T1** Helpers en `src/lib/utils/cursor.ts`:
  - `encodeCursor(createdAt: number, id: number): string` — base64url(`${createdAt}:${id}`).
  - `decodeCursor(s: string): { ts: number, id: number }` — lanza `Error('invalid cursor')` si malformado.
- [ ] **T2** Servicio `listProviderReviews(env, providerId, { limit, cursor? })` en `src/lib/services/reviews.ts`:
  - Si `cursor` presente → `WHERE (created_at, id) < (cursor.ts, cursor.id)`.
  - Siempre `AND status = 'visible' AND provider_id = :pid`.
  - `ORDER BY created_at DESC, id DESC`.
  - `LIMIT :limit + 1` (para detectar `hasMore`).
  - Si hay fila extra → `nextCursor = encodeCursor(items[items.length-1].createdAt, items[items.length-1].id)`. Si no → `nextCursor = null`.
  - JOIN `review_responses` (LEFT) para incluir respuesta si existe.
- [ ] **T3** `getProviderRatingStats(env, providerId)` — `SELECT COUNT(*) AS c, AVG(rating) AS a FROM reviews WHERE provider_id=? AND status='visible'`. Si `c === 0` → `{ avg: null, count: 0 }`.
- [ ] **T4** Validador `reviewsListQuerySchema` y `publicReviewSchema` en `src/lib/validators/reviews.ts`.
- [ ] **T5** Endpoint `src/pages/api/v1/providers/[id]/reviews.ts` (GET):
  - `Astro.params.id` → validar numérico positivo.
  - Verificar provider existe (404 si no).
  - Parsear query con `reviewsListQuerySchema` (400 si falla).
  - Si `cursor` presente → `decodeCursor` dentro de try/catch → 400 si falla.
  - Invocar `listProviderReviews` y `getProviderRatingStats`.
  - Si no hay cursor → incluir `ratingAvg, total` en respuesta.
  - Si hay cursor → `ratingAvg: undefined, total: undefined` (o repetir el de cache — decisión en PR; default: repetir cache de página 1 cuando exista en KV).
- [ ] **T6** Componente `src/components/providers/ReviewsSection.astro`:
  - Props: `reviews, ratingAvg, total, nextCursor`.
  - Header "Opiniones" con icono `ri-star-line text-primary`.
  - Summary con `renderStars(ratingAvg)` y `{ratingAvg.toFixed(1)} · {total} trabajos` (sólo si `total > 0`).
  - Empty state si `reviews.length === 0` ("Sin opiniones todavía").
  - Lista con template de review (`mockups/profile.html:191-199`).
  - Bloque de respuesta anidada si `response !== null`.
  - Botón "Ver más" si `nextCursor !== null`.
- [ ] **T7** Isla pequeña en `ReviewsSection.astro`:
  - `<script>` inline al final.
  - Listener en `[data-action="load-more"]`.
  - `fetch('/api/v1/providers/<id>/reviews?cursor=' + nextCursor)` → `response.json()` → itera items → `insertAdjacentHTML('beforeend', '<div class="bg-gray-50 p-4 rounded-xl mb-4">' + ...)`).
  - Si `nextCursor === null` → oculta botón.
- [ ] **T8** Integrar en `PublicProfile.astro`: pasa `<ReviewsSection reviews={...} ratingAvg={...} total={...} nextCursor={...} />` desde SSR fetch a `/api/v1/providers/<id>/reviews?limit=10`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/utils/cursor.test.ts` — roundtrip, cursor malformado lanza error, base64url safe.
  - [ ] `tests/unit/validators/reviews.test.ts` — `limit=0` falla, `limit=51` falla, `limit=10` default OK, `cursor` opcional.
  - [ ] `tests/unit/components/reviews-section.test.ts` — 3 reseñas rendereadas, empty state con `[]`, respuesta anidada cuando existe, "Ver más" sólo si `nextCursor`.
  - [ ] `tests/integration/providers/reviews-list.test.ts` — seed 15 reseñas (1 hidden); GET `?limit=10` → 10 items + cursor; segunda llamada con cursor → 5 items (intersección vacía con la primera); hidden no aparece; provider inexistente → 404; cursor inválido → 400.
  - [ ] `tests/e2e/profile-reviews.spec.ts` — Playwright carga perfil con 15 reseñas, ve 10, clic "Ver más", ve 15.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: quitar `AND status = 'visible'` de la query → test "reseña hidden no aparece" cae → restaurar
- [ ] Sabotaje 2: olvidar `+1` en el LIMIT → test "nextCursor presente cuando hay más" cae (siempre retorna `null`) → restaurar
- [ ] Sabotaje 3: usar `>` en vez de `<` en la condición del cursor → test "segunda página sin overlap" cae (devuelve las mismas 10) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` y `src/lib/utils/cursor.ts`
- [ ] Type check verde
- [ ] Commit `feat: sección reseñas con promedio y paginación por cursor` y push
