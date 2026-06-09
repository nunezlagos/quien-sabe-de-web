# HU-02.1 — Catálogo de comunas RM como seed

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-02-onboarding-vecino

## Historia de usuario

**Como** sistema
**Quiero** contar con un catálogo de las 52 comunas de la Región Metropolitana
**Para** que el onboarding y los perfiles tengan opciones válidas

## Criterios de aceptación (Gherkin)

### Escenario: Migración inicial crea catálogo
  Cuando se aplica la migración `seed_communes`
  Entonces la tabla `communes` tiene exactamente 52 filas
  Y cada fila tiene `id`, `name`, `slug` (único) y `region="Metropolitana"`

### Escenario: Búsqueda case-insensitive por nombre
  Dado que existe la comuna "Las Condes"
  Cuando envío `GET /api/v1/communes?q=las%20condes`
  Entonces recibo `[{ id, name: "Las Condes", slug: "las-condes" }]`

### Escenario: Re-aplicar seed es idempotente
  Dado que las 52 comunas ya existen
  Cuando se vuelve a ejecutar el seed
  Entonces NO se duplican filas
  Y la cantidad sigue siendo 52

## Tareas técnicas

- [ ] Tabla `communes` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_seed_communes.sql` con las 52 comunas RM
- [ ] Endpoint `src/pages/api/v1/communes.ts` (lectura pública)
- [ ] Tests `tests/integration/communes/list.test.ts` y `tests/integration/communes/seed-idempotent.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
