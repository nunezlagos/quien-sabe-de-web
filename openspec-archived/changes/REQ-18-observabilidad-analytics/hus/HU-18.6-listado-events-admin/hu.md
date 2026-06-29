# HU-18.6 — Tabla paginada de eventos para debug

**Estado:** implementada | **Prioridad:** P2 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** admin
**Quiero** ver el listado paginado de eventos con filtros
**Para** debuggear flujos sin entrar a la base

## Criterios de aceptación (Gherkin)

### Escenario: GET listado con filtros
  Cuando envía `GET /api/v1/admin/analytics/events?event=signup&limit=50`
  Entonces recibo los últimos 50 eventos signup

### Escenario: Filtro por rango temporal
  Cuando envía `?from=2026-06-01&to=2026-06-09`
  Entonces respuesta acotada

### Escenario: Export CSV
  Cuando envía `?format=csv`
  Entonces respuesta es `text/csv` con headers `event, actor_role, props_json, created_at`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/analytics/events.ts`
- [ ] Render CSV en endpoint
- [ ] Componente admin `src/components/admin/EventsTable.astro`
- [ ] Tests `tests/integration/admin/events-list.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
