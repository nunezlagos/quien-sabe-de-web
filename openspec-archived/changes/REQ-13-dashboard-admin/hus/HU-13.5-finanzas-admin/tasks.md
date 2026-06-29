# HU-13.5 — Sección finanzas admin (donaciones/costos)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.5-finanzas-admin`

## Tareas tecnicas

- [ ] **T1** Schema Zod `financesQuerySchema` en `src/lib/validators/admin-finances.ts`.
- [ ] **T2** Servicio `getFinancesSummary(env, { from, to })` en `src/lib/services/admin/finances.ts` con queries descritas en design.md y try/catch para tabla `expenses` ausente.
- [ ] **T3** Helper `formatCLP(amount: number): string` en `src/lib/utils/format.ts` (formato `$ 1.234.567`).
- [ ] **T4** Endpoint `src/pages/api/v1/admin/finances/summary.ts` (`GET`) con guard HU-13.1.
- [ ] **T5** Componente `FinanceKpiCard.astro` con props `{ label, value, pendingData }`.
- [ ] **T6** Componente `FinancesPanel.astro` con 3 KPI cards + filtros date + tabla `by_month`.
- [ ] **T7** Reuso de `computeRatio` de HU-14.9 (verificar que el path está disponible antes de importar).
- [ ] **T8** Cablear `FinancesPanel` en `finances-section` de `dashboard-admin.astro`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/admin-finances/finances-query-schema.test.ts` — from > to rechaza; formatos regex.
  - [ ] `tests/integration/admin/finances-summary.test.ts` — con seed donations=800k, expenses=1M → ratio=0.80; expenses=0 → null+no_expenses.
  - [ ] `tests/integration/admin/finances-filters.test.ts` — from/to aplicados; serie mensual respeta rango.
  - [ ] `tests/integration/admin/finances-rbac.test.ts` — vecino 403; sin sesión 401.
  - [ ] `tests/integration/admin/finances-pending.test.ts` — sin tabla `expenses` → pendingData=true en gastos, ratio=null.
  - [ ] `tests/e2e/admin-finances.spec.ts` — admin abre, ve KPIs, cambia rango, tabla refleja.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-finances.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: invertir la división `donations / expenses` por `expenses / donations` en el llamador a `computeRatio` → test "ratio 0.80 con 800k/1M" cae en rojo → restaurar
  - [ ] Sabotaje 2: quitar el `try/catch` alrededor de la query de `expenses` → test "pendingData con tabla ausente" rompe con excepción → restaurar
  - [ ] Sabotaje 3: comentar `WHERE status = 'approved'` en donations → test "ratio no incluye refunded" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/finances.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
