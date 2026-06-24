# HU-04.1 — Schema providers + trades con seed

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.1-schema-providers-trades`

## Tareas tecnicas

- [ ] **T1** Agregar `trades` y `providers` a `src/database/schema.ts` siguiendo el design (con `cover_r2_key` ya nullable para evitar migración extra en HU-04.6).
- [ ] **T2** Helper `generateProviderSlug(name, commune, suffix?)` en `src/lib/utils/slug.ts` con normalización kebab-case y sufijo aleatorio de 4 chars cuando hay colisión.
- [ ] **T3** Servicio `seedTrades(db)` en `src/lib/services/trades.ts` que inserta los 5 oficios mínimos con `INSERT OR IGNORE`.
- [ ] **T4** Generar migración con `docker exec quien-sabe-app bun run db:generate` y revisar `0002_providers_trades.sql`.
- [ ] **T5** Aplicar migración con `docker exec quien-sabe-app bun run db:migrate:local`. Verificar `sqlite3` local que existan tablas y que `SELECT COUNT(*) FROM trades` retorne 5.
- [ ] **T6** Tests:
  - [ ] `tests/integration/providers/schema.test.ts` — FKs presentes, `UNIQUE(user_id)` rechaza segunda fila, `UNIQUE(slug)` rechaza duplicado.
  - [ ] `tests/integration/trades/seed.test.ts` — `seedTrades(db)` 2 veces seguidas → siguen 5 oficios.
  - [ ] `tests/unit/utils/slug.test.ts` — kebab-case, sin acentos, sufijo en colisión.
- [ ] **T7** Verificar `PRAGMA foreign_keys = ON` (test previo `tests/integration/db/fk.test.ts`) — si no existe, crearlo en T6 como dependencia.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Borrar el `UNIQUE` constraint de `providers.user_id` en la migración → `tests/integration/providers/schema.test.ts` debe caer al intentar segundo insert → restaurar.
- [ ] **S2** Cambiar `INSERT OR IGNORE` por `INSERT` en el seed → segundo `seedTrades` debe fallar con constraint violation → restaurar.
- [ ] **S3** Eliminar la columna `slug` de `trades` en el schema → `tests/unit/utils/slug.test.ts` (asumiendo fixture que use trade.slug) debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/trades.ts` y `src/lib/utils/slug.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
