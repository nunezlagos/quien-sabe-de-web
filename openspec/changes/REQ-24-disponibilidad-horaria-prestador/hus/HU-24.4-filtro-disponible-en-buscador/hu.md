# HU-24.4 — Filtro available_now en /search

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Historia de usuario

**Como** vecino con urgencia
**Quiero** filtrar prestadores disponibles ahora mismo
**Para** encontrar ayuda inmediata

## Criterios de aceptación (Gherkin)

### Escenario: Query filtra por disponibilidad actual
  Cuando envío `GET /api/v1/search?trade=gasfiter&available_now=true`
  Entonces sólo se devuelven prestadores cuyo `isAvailableNow(now)` es true

### Escenario: Combinable con otros filtros
  Cuando combino `?commune=Santiago&available_now=true`
  Entonces ambos filtros aplican

### Escenario: UI hero (index.html) gana checkbox
  Cuando reviso `mockups/index.html` hero search (líneas 76-100)
  Entonces se agrega checkbox "Disponible ahora" después del select de comuna (extensión del mockup, mismo estilo de borde y rounded)

### Escenario: Resultado vacío con mensaje
  Cuando no hay prestadores disponibles
  Entonces se renderiza empty state con CTA "Ver todos"

## Tareas técnicas

- [ ] Extender endpoint `src/pages/api/v1/search.ts` (REQ-06) con param `available_now`
- [ ] Subquery SQL que filtra por rangos vigentes (con materialización o lateral join Drizzle)
- [ ] Agregar checkbox en hero search (`src/pages/index.astro`)
- [ ] Tests `tests/integration/search/available-now.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
