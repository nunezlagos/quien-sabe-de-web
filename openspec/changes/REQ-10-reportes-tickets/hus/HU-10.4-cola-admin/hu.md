# HU-10.4 — Cola admin con filtros

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** admin
**Quiero** ver la cola de tickets con filtros por estado, tipo y asignado
**Para** operar la mesa de soporte eficientemente

## Criterios de aceptación (Gherkin)

### Escenario: Listado paginado
  Dado 25 tickets
  Cuando admin envía `GET /api/v1/admin/tickets?status=abierto&limit=10`
  Entonces recibo `{ items: [...10], cursor }`

### Escenario: Filtro por kind y asignado
  Cuando envío `?kind=suplantacion&assignee=me`
  Entonces sólo aparecen tickets de ese tipo asignados al admin en sesión

### Escenario: Cualquier usuario no admin → 403
  Dado un vecino
  Cuando intenta listar
  Entonces recibo status 403

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/tickets.ts`
- [ ] Sección `src/components/admin/TicketsQueue.astro`
- [ ] Tests `tests/integration/admin/tickets-list.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
