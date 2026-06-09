# HU-18.5 — Dashboard de KPIs vs targets OE

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** admin
**Quiero** ver los KPIs vinculados a OE1/OE2/OE3 con su progreso vs target
**Para** monitorear el cumplimiento de objetivos

## Criterios de aceptación (Gherkin)

### Escenario: Widgets renderizan los 3 OE
  Cuando admin entra a `/dashboard-admin#analytics`
  Entonces ve widgets: p95 search vs 500 ms (OE1), precisión search vs 100% (OE2), ratio donaciones vs 80% (OE3)

### Escenario: Datos en cuasi-tiempo-real (≤5 min)
  Dado eventos recientes
  Cuando se renderiza
  Entonces los widgets reflejan datos de los últimos 5 min

### Escenario: Sin datos → estado vacío legible
  Dado entorno limpio sin eventos
  Cuando se renderiza
  Entonces aparece "Sin datos aún" en lugar de números falsos

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/analytics/kpis.ts` extendido
- [ ] Componente `src/components/admin/AnalyticsDashboard.astro`
- [ ] Tests `tests/integration/admin/analytics-kpis.test.ts`, `tests/e2e/admin-analytics.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
