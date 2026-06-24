# HU-15.1 — Schema expenses + monthly_reports

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.1-schema-expenses-reports`

## Tareas técnicas

- [ ] **T1** Agregar tablas `expenses` y `monthly_reports` a `src/database/schema.ts` siguiendo el modelo del `design.md` (ULID, FK `created_by`, CHECK `amount_clp > 0`, PK natural `yyyy_mm`).
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_finance.sql` con CHECKs explícitos y FK `created_by REFERENCES users(id) ON DELETE SET NULL`.
- [ ] **T3** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio`.
- [ ] **T4** Validadores `expenseRowSchema` y `yyyyMmSchema` en `src/lib/validators/expenses.ts` (Zod, base reutilizada por HU-15.2).
- [ ] **T5** Helper ULID en `src/lib/utils/ulid.ts` si no existe (genera 26 chars Crockford base32). `monthly_reports` no necesita ULID.
- [ ] **T6** Verificar que `PRAGMA foreign_keys = ON` esté activo en `src/database/client.ts`.
- [ ] **T7** Tests:
  - [ ] `tests/integration/finance/schema.test.ts` — migración aplica, CHECK `amount_clp > 0` rechaza 0 y negativos, PK natural `yyyy_mm` impide duplicados, índices `idx_expenses_paid_at` y `idx_expenses_document` presentes en `sqlite_master`.
  - [ ] `tests/unit/utils/ulid.test.ts` — genera 26 chars, monotónico aproximado (mismo ms → orden).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: eliminar CHECK `amount_clp > 0` en la migración → test rojo al insertar 0 → restaurar
- [ ] Sabotaje 2: cambiar PK de `monthly_reports` de `yyyy_mm` a `id autoincrement` → test rojo (no se garantiza unicidad por mes) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/validators/expenses.ts` y `src/lib/utils/ulid.ts`
- [ ] Type check verde
- [ ] Commit `feat: schema expenses + monthly_reports` y push