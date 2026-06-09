# HU-09.5 — Promedio público y filtro por rating

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-09-resenas-rating

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver el rating promedio del prestador
**Para** ponderar reputación de forma rápida

## Criterios de aceptación (Gherkin)

### Escenario: Promedio excluye reseñas ocultas
  Dado 4 reseñas visibles [5,4,5,4] y 1 oculta de rating 1
  Cuando consulto el perfil
  Entonces `rating_avg = 4.5`

### Escenario: Sin reseñas el promedio es null
  Dado un prestador sin reseñas
  Cuando consulto su perfil
  Entonces `rating_avg: null`

### Escenario: Promedio cacheado se invalida tras nueva reseña
  Dado el promedio cacheado en 4.5
  Cuando se crea una reseña con rating 1
  Entonces el siguiente GET refleja el nuevo promedio

## Tareas técnicas

- [ ] Subquery agregada en el resolver de `providers`
- [ ] Trigger de invalidación de cache edge tras INSERT/UPDATE de `reviews`
- [ ] Reuso del filtro `min_rating` en búsqueda (REQ-06)
- [ ] Tests `tests/integration/reviews/avg.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
