# HU-09.5 — Promedio público y filtro por rating

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.5-promedio-publico`

## Tareas técnicas

- [ ] **T1** Implementar completamente `getProviderRatingStats` en `src/lib/services/reviews.ts` (la firma ya existe de HU-09.1):
  - `SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE provider_id = ? AND status = 'visible'`.
  - Si `count === 0` → `{ avg: null, count: 0 }`.
  - Si avg no es null → `parseFloat(Number(avg).toFixed(2))`.
- [ ] **T2** Validador `ratingStatsSchema` en `src/lib/validators/reviews.ts`.
- [ ] **T3** Exportar helper `buildMinRatingSubquerySql()` en `src/lib/services/reviews.ts`:
  - Retorna el SQL template `'(SELECT AVG(rating) FROM reviews WHERE provider_id = providers.id AND status = \'visible\')'`.
  - REQ-06 lo usa como subquery en `WHERE`.
- [ ] **T4** Actualizar `getPublicProviderByIdOrSlug` en `src/lib/services/providers.ts` para usar `getProviderRatingStats` ya implementado (consumir del servicio de reviews en lugar de stub).
- [ ] **T5** Tests:
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `getProviderRatingStats` con 0 reseñas → `{ avg: null, count: 0 }`; con `[5,4,5,4]` → `{ avg: 4.5, count: 4 }`; con `[5,4,5,4, hidden=1]` → `{ avg: 4.5, count: 4 }`.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `getProviderRatingStats` con promedio 3.6666 → `{ avg: 3.67, count: 3 }` (redondeo).
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `buildMinRatingSubquerySql()` retorna string SQL correcto.
  - [ ] `tests/integration/reviews/avg.test.ts` — seed 4 reseñas visibles rating=5 y 1 visible rating=4, 1 hidden rating=1; `getProviderRatingStats` → avg=4.6, count=5; PATCH hide → avg=4.5, count=5; INSERT nueva rating=1 → avg=4.4, count=6.
  - [ ] `tests/integration/providers/public-get.test.ts` (extender) — GET perfil tras cambios → `ratingAvg` correcto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: olvidar el filtro `AND status = 'visible'` → test "ocultar reseña cambia el promedio" cae → restaurar
- [ ] Sabotaje 2: usar `parseInt(avg)` en vez de `parseFloat(Number(avg).toFixed(2))` → test "promedio 4.5 (no 4)" cae → restaurar
- [ ] Sabotaje 3: cambiar `count === 0` por `avg === null` para detectar "sin reseñas" → test "con avg=0 pero count>0" cae (caso edge: todas las reseñas con rating 0, aunque CHECK lo impide, es defensa en profundidad) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` (rama stats)
- [ ] Type check verde
- [ ] Commit `feat: promedio público excluyendo ocultas + subquery reutilizable` y push
