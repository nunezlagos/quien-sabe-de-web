# HU-06.2 — Filtros combinables (comuna, rating, verified)

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** vecino
**Quiero** filtrar resultados por comuna, rating mínimo y verificación
**Para** encontrar al prestador adecuado más rápido

## Criterios de aceptación (Gherkin)

### Escenario: Filtro por comuna
  Cuando envío `GET /api/v1/search?trade=gasfiter&commune=las-condes`
  Entonces sólo aparecen prestadores con `commune.slug="las-condes"` o cobertura en esa comuna

### Escenario: Filtro rating mínimo
  Dado prestadores con rating [4.8, 4.2, 3.5, 5.0]
  Cuando envío `GET /api/v1/search?trade=gasfiter&min_rating=4`
  Entonces sólo aparecen los con rating >= 4

### Escenario: Combinación AND de filtros
  Cuando envío `GET /api/v1/search?trade=gasfiter&commune=nunoa&min_rating=4.5&verified_only=true`
  Entonces los resultados cumplen TODAS las condiciones simultáneamente

### Escenario: verified_only=true es default seguro
  Cuando envío `GET /api/v1/search?trade=gasfiter&verified_only=false`
  Entonces se incluyen no-verificados (uso interno o debug)

## Tareas técnicas

- [ ] Extender `queryBuilder.ts` con condiciones combinables
- [ ] Validación Zod de query params en `src/lib/validators/searchParams.ts`
- [ ] Subquery de rating promedio sobre `reviews` con `status='visible'`
- [ ] Tests `tests/integration/search/filters.test.ts` para cada combinación

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
