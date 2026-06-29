# HU-28.1 — Esquema user_favorites

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-28-actividad-vecino-favoritos
**Rama:** `feat/HU-28.1-schema-favoritos`

## Tareas técnicas

- [ ] **T1** Agregar tabla `user_favorites` a `src/database/schema.ts` con PK compuesta `(user_id, provider_id)`, FK `user_id → users(id) ON DELETE CASCADE`, FK `provider_id → providers(id) ON DELETE CASCADE`, índice `idx_user_favorites_user_created(user_id, created_at DESC)`.
- [ ] **T2** Servicio `src/lib/services/activity/favorites.ts` con `listFavorites(db, userId, limit?)`, `addFavorite(db, userId, providerId)` (insert-or-ignore por PK), `removeFavorite(db, userId, providerId)` (delete idempotente), `isFavorite(db, userId, providerId)`.
- [ ] **T3** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_user_favorites.sql` con tabla, PK compuesta, índices y FKs.
- [ ] **T4** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio`.
- [ ] **T5** Tipo exportado `FavoriteRow` desde schema; usar en servicios.
- [ ] **T6** Tests:
  - [ ] `tests/unit/favorites/schema.test.ts` — estructura de tabla, FKs, PK compuesta.
  - [ ] `tests/unit/favorites/list-favorites.test.ts` — orden por `created_at DESC`, exclusión de soft-deleted (`providers.deleted_at IS NULL`).
  - [ ] `tests/integration/favorites/migration.test.ts` — migración aplica limpia contra D1 in-memory.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `addFavorite`, no usar insert-or-ignore → segundo POST falla con UNIQUE, test integración rojo → restaurar
- [ ] Sabotaje 2: en `listFavorites`, olvidar el filtro `deleted_at IS NULL` → favoritos de prestadores soft-deleted aparecen, test unitario rojo → restaurar
- [ ] Type check verde
- [ ] Commit `feat: schema user_favorites` y push