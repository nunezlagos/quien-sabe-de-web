# HU-15.2 — CRUD de gastos admin

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** admin
**Quiero** registrar gastos con monto, fecha y documento
**Para** alimentar el reporte de transparencia

## Criterios de aceptación (Gherkin)

### Escenario: Crear gasto válido
  Cuando envía `POST /api/v1/admin/expenses` con `{"provider":"Cloudflare","amount_clp":15000,"paid_at":"2026-05-01","note":"Workers Paid"}`
  Entonces recibo status 201

### Escenario: Asociar documento R2
  Cuando envía `PATCH /api/v1/admin/expenses/<id>` con `document_r2_key`
  Entonces el campo persiste

### Escenario: Eliminar gasto reciente
  Cuando envía `DELETE /api/v1/admin/expenses/<id>`
  Entonces recibo 204
  Y se audita

### Escenario: No-admin → 403
  Dado vecino
  Cuando intenta crear
  Entonces 403

## Tareas técnicas

- [ ] Endpoints `src/pages/api/v1/admin/expenses/index.ts` y `[id].ts`
- [ ] Zod schemas en `src/lib/validators/expenses.ts`
- [ ] Componente `src/components/admin/ExpensesManager.astro`
- [ ] Tests `tests/integration/admin/expenses.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
