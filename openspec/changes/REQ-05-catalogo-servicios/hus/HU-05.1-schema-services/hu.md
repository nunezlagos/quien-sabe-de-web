# HU-05.1 — Schema services y service_coverage

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-05-catalogo-servicios

## Historia de usuario

**Como** sistema
**Quiero** modelar servicios del prestador y su zona de cobertura
**Para** poder filtrar y mostrar oferta por comuna

## Criterios de aceptación (Gherkin)

### Escenario: Migración crea tablas
  Cuando se aplica la migración
  Entonces existen `services` (con FK a `providers`) y `service_coverage` (FK a services y communes)
  Y `services.sort_order` es entero
  Y `services.status` es enum `active|inactive`

### Escenario: Constraint precio positivo
  Cuando intento insertar `services` con `price_clp=-10`
  Entonces el insert falla por CHECK constraint

### Escenario: Cascade delete al eliminar provider
  Dado un provider con 3 servicios
  Cuando el provider es eliminado físicamente (no soft-delete)
  Entonces sus servicios y coverage se eliminan en cascada

## Tareas técnicas

- [ ] Schema `services` en `src/database/schema.ts`
- [ ] Schema `service_coverage` con clave compuesta
- [ ] Migración `src/database/migrations/00XX_services.sql`
- [ ] Tests `tests/integration/services/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
