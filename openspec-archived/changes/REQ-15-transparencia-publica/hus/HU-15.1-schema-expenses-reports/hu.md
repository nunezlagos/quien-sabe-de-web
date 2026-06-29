# HU-15.1 — Schema expenses + monthly_reports

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** sistema
**Quiero** modelar gastos y reportes mensuales
**Para** respaldar la transparencia financiera

## Criterios de aceptación (Gherkin)

### Escenario: Migración crea tablas
  Cuando se aplica la migración
  Entonces existen `expenses(id, provider, amount_clp, paid_at, document_r2_key, note)` y `monthly_reports(yyyy_mm PK, donations_total, expenses_total, ratio, pdf_r2_key, generated_at)`

### Escenario: amount_clp > 0
  Cuando intento insertar amount=0
  Entonces el CHECK falla

## Tareas técnicas

- [ ] Schema `expenses` y `monthly_reports` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_finance.sql`
- [ ] Tests `tests/integration/finance/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
