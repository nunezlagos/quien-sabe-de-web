# HU-23.1 — Esquema portfolio_images con límite 5

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-23-portfolio-prestador

## Historia de usuario

**Como** plataforma
**Quiero** persistir hasta 5 imágenes de portafolio por prestador
**Para** alimentar la galería pública

## Criterios de aceptación (Gherkin)

### Escenario: Tabla creada con constraints
  Cuando aplico la migración
  Entonces existe tabla `portfolio_images (id, provider_id, r2_key, sort_order, created_at)`
  Y UNIQUE `(provider_id, sort_order)` definido

### Escenario: Límite 5 enforced en aplicación
  Dado prestador con 5 imágenes
  Cuando se intenta insertar 6ta vía servicio
  Entonces el servicio rechaza con error `"max 5 images"` (validación en código, dado SQLite no soporta CHECK con COUNT)

### Escenario: Cascada al borrar prestador
  Dado prestador soft-deleted
  Cuando se ejecuta cleanup job (REQ-22)
  Entonces sus filas portfolio_images quedan marcadas para cleanup R2

### Escenario: Seed para tests
  Cuando ejecuto tests
  Entonces existe seed con prestadores que reflejen modelo de `mockups/js/data.js` (portfolio arrays)

## Tareas técnicas

- [ ] Modificar `src/database/schema.ts` añadiendo tabla `portfolioImages`
- [ ] Generar migración con `docker exec quien-sabe-app bun run db:generate`
- [ ] Helper `assertPortfolioCapacity(providerId)` en `src/lib/services/portfolio/limits.ts`
- [ ] Tests `tests/unit/portfolio/limits.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
