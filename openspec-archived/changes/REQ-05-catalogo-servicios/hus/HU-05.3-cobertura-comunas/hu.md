# HU-05.3 — Cobertura multi-comuna del servicio

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-05-catalogo-servicios

## Historia de usuario

**Como** prestador
**Quiero** elegir varias comunas donde ofrezco cada servicio
**Para** captar vecinos de toda la zona en que puedo trabajar

## Criterios de aceptación (Gherkin)

### Escenario: Asignar 3 comunas a un servicio
  Cuando envío `PATCH /api/v1/providers/me/services/7` con `{"coverage_commune_ids":[13114, 13123, 13109]}`
  Entonces recibo status 200
  Y `service_coverage` tiene 3 filas para `service_id=7`

### Escenario: Reemplazar coverage es atómico
  Dado un servicio con 3 comunas asignadas
  Cuando envío PATCH con `coverage_commune_ids:[13114]`
  Entonces las 3 anteriores son eliminadas y queda sólo una
  Y la operación es transaccional (no estado intermedio visible)

### Escenario: Comuna inexistente → 422
  Cuando envío `coverage_commune_ids:[99999]`
  Entonces recibo status 422

## Tareas técnicas

- [ ] Endpoint extendido `PATCH /api/v1/providers/me/services/[id].ts`
- [ ] Helper `replaceCoverage(serviceId, communeIds)` con transacción Drizzle
- [ ] Validación whitelist contra `communes`
- [ ] Tests `tests/integration/services/coverage.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
