# HU-13.3 — CRUD de oficios (trades) con reorder

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.3-taxonomia-oficios`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_trades_sort_order.sql`: ADD COLUMN sort_order + CREATE INDEX + UPDATE backfill (sort_order = id * 1000).
- [ ] **T2** Actualizar `src/database/schema.ts#trades` con `sortOrder`, `isActive`, índices.
- [ ] **T3** Schemas Zod `tradeCategorySchema`, `tradeCreateSchema`, `tradePatchSchema`, `tradeReorderSchema` en `src/lib/validators/admin-trades.ts`.
- [ ] **T4** Servicio `listTradesForAdmin`, `createTrade`, `patchTrade`, `deleteTrade`, `reorderTrades` en `src/lib/services/admin/trades.ts`.
- [ ] **T5** Custom errors: `SlugConflictError`, `TradeInUseError` con `toHttpResponse()` que mapea a 409 con `{"error": "..."}`.
- [ ] **T6** Endpoints:
  - [ ] `src/pages/api/v1/admin/trades/index.ts` — `GET`, `POST`
  - [ ] `src/pages/api/v1/admin/trades/[id].ts` — `PATCH`, `DELETE`
  - [ ] `src/pages/api/v1/admin/trades/reorder.ts` — `POST`
- [ ] **T7** Cada mutación llama `logAdminAction(env, actor.id, 'create'|'update'|'delete', 'trades', id, before, after)`.
- [ ] **T8** Componente `TradesManager.astro` con tabla + SortableJS + fallback botones ↑ ↓.
- [ ] **T9** Componente `TradeRow.astro` con handle drag + acciones.
- [ ] **T10** Componente `TradeModal.astro` (create + edit en uno, condicionado por `mode` prop).
- [ ] **T11** Cablear `TradesManager` en la sección `trades-section` de `dashboard-admin.astro`.
- [ ] **T12** Tests:
  - [ ] `tests/unit/admin-trades/create-schema.test.ts` — slug duplicado 409; slug con mayúsculas rechaza; category inválida rechaza.
  - [ ] `tests/unit/admin-trades/patch-schema.test.ts` — body vacío rechaza; campo `slug` rechazado por `.strict()`.
  - [ ] `tests/integration/admin/trades-create.test.ts` — 201 + audit log; slug duplicado 409.
  - [ ] `tests/integration/admin/trades-delete.test.ts` — sin uso 204; en uso 409; audit log.
  - [ ] `tests/integration/admin/trades-reorder.test.ts` — reorder persiste; audit log; partial array rechazado.
  - [ ] `tests/e2e/admin-trades.spec.ts` — crear, editar sin cambiar slug, drag reorder, intento delete en uso muestra toast.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-trades.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar el check `SELECT 1 FROM provider_trades WHERE trade_id = ?` en `deleteTrade` → test "delete en uso 409" cae en rojo → restaurar
  - [ ] Sabotaje 2: cambiar `sort_order = index * 1000` por `sort_order = index` → test "inserción intermedia no requiere re-shuffle" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar `z.object(...).strict()` en `tradePatchSchema` → test "PATCH con slug cambia slug" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/trades.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
