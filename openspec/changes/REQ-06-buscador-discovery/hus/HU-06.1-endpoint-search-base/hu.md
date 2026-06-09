# HU-06.1 — Endpoint base de búsqueda por oficio

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** visitante anónimo o vecino
**Quiero** buscar prestadores por oficio
**Para** encontrar quién puede ayudarme

## Criterios de aceptación (Gherkin)

### Escenario: Búsqueda por oficio retorna prestadores activos
  Dado 5 prestadores publicados con `trade.slug="gasfiter"`
  Cuando envío `GET /api/v1/search?trade=gasfiter`
  Entonces recibo status 200 con `{ items: [...5], cursor: null }`
  Y cada item tiene `id, slug, trade, commune, verified, rating_avg, photo_url`

### Escenario: Búsqueda sin parámetros retorna mix
  Cuando envío `GET /api/v1/search`
  Entonces recibo prestadores ordenados por relevancia default

### Escenario: Trade inexistente retorna lista vacía
  Cuando envío `GET /api/v1/search?trade=inexistente`
  Entonces recibo `{ items: [], cursor: null }`

### Escenario: Prestadores no verificados están excluidos por default
  Dado prestadores con verificación pendiente
  Cuando envío `GET /api/v1/search?trade=gasfiter`
  Entonces sólo aparecen los `verified=true`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/search/index.ts`
- [ ] Builder de query Drizzle en `src/lib/services/search/queryBuilder.ts`
- [ ] Excluir prestadores con status != 'published' o sin verificación
- [ ] Tests `tests/unit/search/queryBuilder.test.ts`, `tests/integration/search/base.test.ts` con 50 prestadores seed

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
