# HU-15.2 — CRUD de gastos admin

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.2-crud-expenses-admin`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/expenses.ts` con `createExpense`, `updateExpense`, `deleteExpense`, `listExpenses`, `getExpense`. Cada mutación registra log estructurado (actorId + before/after).
- [ ] **T2** Validadores `createExpenseSchema`, `updateExpenseSchema`, `expensesQuerySchema` en `src/lib/validators/expenses.ts` (extiende HU-15.1). Validar prefijo `expenses/` en `document_r2_key` para evitar keys arbitrarias.
- [ ] **T3** Helper de cursor (`encodeCursor`/`decodeCursor` sobre `paid_at+id`) en `src/lib/utils/cursor.ts` si no existe.
- [ ] **T4** Endpoints:
  - `src/pages/api/v1/admin/expenses/index.ts` (GET, POST)
  - `src/pages/api/v1/admin/expenses/[id].ts` (GET, PATCH, DELETE)
- [ ] **T5** Helper `requireAdmin(context)` (también usado por HU-15.4/15.5/15.6) en `src/lib/middleware/admin.ts`. Centraliza 401/403.
- [ ] **T6** Componente `src/components/admin/ExpensesManager.astro`. Mockup base `mockups/dashboard-admin.html:268-274`. Isla con botón "Nuevo Gasto" + tabla.
- [ ] **T7** Componente `src/components/admin/ExpenseFormModal.astro` con props `{mode, initial?}`. Mockup base `mockups/dashboard-admin.html:287-342`. Isla con submit fetch + cerrar modal.
- [ ] **T8** Componente `src/components/admin/ExpensesTable.astro` con props `{items, nextCursor?}`. Mockup base: tabla genérica admin (estilo `mockups/transparency.html:66-97` con columna acciones). Isla con botones editar/eliminar.
- [ ] **T9** Integrar `ExpensesManager` en `src/pages/admin/index.astro` sección Finanzas (`mockups/dashboard-admin.html:33`).
- [ ] **T10** Tras POST/PATCH/DELETE exitoso → invocar `invalidateSummaryCache` (HU-15.3) para que `/transparency` refresque.
- [ ] **T11** Tests:
  - [ ] `tests/unit/validators/expenses.test.ts` — schemas aceptan/rechazan casos límite (amount=0, paid_at mal formado, note >500, document_r2_key fuera de prefijo).
  - [ ] `tests/unit/services/expenses.test.ts` — `listExpenses` con cursor produce next cursor correcto.
  - [ ] `tests/integration/admin/expenses.test.ts` — 4 escenarios Gherkin (crear válido, PATCH con doc, eliminar 204, no-admin 403), paginación con cursor, filtros `from`/`to`, 404 en `:id` inexistente.
  - [ ] `tests/e2e/admin-expenses.spec.ts` — login admin → crear gasto desde modal → ver fila → editar → eliminar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `createExpense`, omitir la verificación de rol admin → test integración con sesión vecino da 201 → restaurar
- [ ] Sabotaje 2: en `deleteExpense`, no chequear FK a monthly_reports congelados → test rojo (debería 409 con force=false) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/expenses.ts`
- [ ] Type check verde
- [ ] Commit `feat: CRUD gastos admin` y push