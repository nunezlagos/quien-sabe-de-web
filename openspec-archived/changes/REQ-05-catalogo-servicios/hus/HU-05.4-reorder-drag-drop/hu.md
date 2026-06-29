# HU-05.4 — Reordenar servicios con drag and drop

**Estado:** planificada | **Prioridad:** P2 | **REQ padre:** REQ-05-catalogo-servicios

## Historia de usuario

**Como** prestador
**Quiero** reordenar mis servicios arrastrando
**Para** destacar primero los más importantes

## Criterios de aceptación (Gherkin)

### Escenario: Reorder válido persiste sort_order
  Dado servicios con ids [7,8,9] y sort_order [0,1,2]
  Cuando envío `POST /api/v1/providers/me/services/reorder` con `{"order":[9,7,8]}`
  Entonces recibo status 200
  Y `sort_order` queda 9→0, 7→1, 8→2

### Escenario: Reorder con id ajeno → 403
  Cuando el prestador A incluye un id de B en el array
  Entonces recibo status 403 y nada cambia

### Escenario: Reorder con array incompleto → 422
  Dado el prestador tiene 3 servicios
  Cuando envío `order:[7]`
  Entonces recibo status 422 con `{ "error": "debe incluir todos los servicios" }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/services/reorder.ts`
- [ ] Transacción Drizzle que actualiza `sort_order` en una sola operación
- [ ] Componente `src/components/dashboard/provider/ServicesList.astro` con drag-drop accesible
- [ ] Tests `tests/integration/services/reorder.test.ts`, `tests/e2e/services-reorder.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
