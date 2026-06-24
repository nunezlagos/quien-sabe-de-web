# HU-13.4 — Widgets de métricas globales

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin
**Quiero** ver los KPIs globales de la plataforma
**Para** monitorear el cumplimiento de OE1/OE2/OE3

## Criterios de aceptación (Gherkin)

### Escenario: GET resumen global
  Cuando envía `GET /api/v1/admin/analytics/kpis`
  Entonces recibo `{ signups_30d, contacts_30d, ratio_donations_costs, p95_ms_search, precision_search }`

### Escenario: Datos cacheados ≤ 5 min
  Dado un cache hit en KV con TTL 300 s
  Cuando se consulta nuevamente
  Entonces se sirve desde cache

### Escenario: Sólo admin
  Dado vecino
  Cuando consulta
  Entonces 403

> **Nota de contrato vs mockup:** Los 4 KPIs del mockup (Usuarios Totales, Oficios Activos, Valoración Media, Solicitudes) son ilustrativos; el endpoint devuelve el contrato definido en HU-13.4 (`signups_30d`, `contacts_30d`, `ratio_donations_costs`, `p95_ms_search`, `precision_search`).

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/analytics/kpis.ts`
- [ ] Componente `src/components/admin/KpisOverview.astro`
- [ ] Cache KV `kpis:global`
- [ ] Tests `tests/integration/admin/kpis.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
