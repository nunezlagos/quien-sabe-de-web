# HU-13.5 — Sección finanzas admin (donaciones/costos)

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin
**Quiero** ver el ratio donaciones/costos
**Para** tomar decisiones para llegar a OE3 (≥ 80% en mes 12)

## Criterios de aceptación (Gherkin)

### Escenario: GET resumen finanzas
  Cuando envía `GET /api/v1/admin/finances/summary`
  Entonces recibo `{ donations_total_clp, expenses_total_clp, ratio, by_month: [...] }`

### Escenario: Ratio cero cuando expenses=0
  Dado expenses_total=0 y donations_total>0
  Cuando se consulta
  Entonces `ratio = null` con flag `no_expenses=true`

### Escenario: Filtros por rango
  Cuando envía `?from=2026-01-01&to=2026-06-30`
  Entonces los agregados quedan acotados

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/finances/summary.ts`
- [ ] Componente `src/components/admin/FinancesPanel.astro`
- [ ] Cálculo `computeRatio(donations, expenses)` en `src/lib/services/finance/ratio.ts`
- [ ] Tests `tests/unit/finance/ratio.test.ts`, `tests/integration/admin/finances.test.ts`
- [ ] Reemplazar placeholder 'Sección Finanzas - Próximamente' en `mockups/dashboard-admin.html:271-277` por panel real: total donaciones CLP (período), total gastos CLP, ratio OE3 con barra de progreso al 80%, gráfico 'donaciones vs gastos' por mes.

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
