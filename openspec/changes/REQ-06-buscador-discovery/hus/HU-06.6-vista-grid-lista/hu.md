# HU-06.6 — Switch grid/lista en resultados de búsqueda

**Estado:** planificada | **Prioridad:** P2 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** vecino
**Quiero** alternar entre vista grid y lista
**Para** ver los resultados como me resulta más cómodo

## Criterios de aceptación (Gherkin)

### Escenario: Toggle a vista lista
  Dado un vecino en `/search` con vista grid
  Cuando clickea el botón "Lista"
  Entonces los resultados se renderizan en modo lista
  Y la preferencia queda en `localStorage` con clave `search.view`

### Escenario: Persistencia entre sesiones
  Dado un vecino que eligió "lista"
  Cuando vuelve a `/search` días después
  Entonces inicia automáticamente en modo lista

### Escenario: Vista no afecta resultados
  Dado los mismos filtros
  Cuando alterno grid/lista
  Entonces los items son los mismos, sólo cambia el layout

## Tareas técnicas

- [ ] Componente `src/components/search/ViewToggle.astro`
- [ ] Variantes `src/components/search/ResultCardGrid.astro` y `ResultCardList.astro`
- [ ] Persistencia en `localStorage`
- [ ] Tests `tests/e2e/search-view-toggle.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
