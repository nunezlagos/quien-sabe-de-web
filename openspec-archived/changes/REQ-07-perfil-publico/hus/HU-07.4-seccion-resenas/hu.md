# HU-07.4 — Sección de reseñas con promedio y paginación

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver las reseñas y el promedio del prestador
**Para** ponderar su reputación antes de contactar

## Criterios de aceptación (Gherkin)

### Escenario: Listado primeras 10 reseñas + promedio
  Dado un prestador con 15 reseñas visibles, rating promedio 4.6
  Cuando envío `GET /api/v1/providers/42/reviews?limit=10`
  Entonces recibo `{ items: [...10], cursor: "<x>", rating_avg: 4.6, total: 15 }`

### Escenario: Reseñas ocultas no aparecen
  Dado una reseña con `status="hidden"`
  Cuando se lista
  Entonces NO aparece en items
  Y no afecta `rating_avg`

### Escenario: Paginación con cursor
  Cuando envío segundo request con `cursor`
  Entonces recibo los siguientes 5 sin duplicar

### Escenario: Provider sin reseñas
  Dado un prestador sin reseñas
  Cuando se consulta
  Entonces `{ items: [], total: 0, rating_avg: null }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/[id]/reviews.ts`
- [ ] Componente `src/components/providers/ReviewsSection.astro` con paginación cliente
- [ ] Reuso del helper `encodeCursor`
- [ ] Tests `tests/integration/providers/reviews-list.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
