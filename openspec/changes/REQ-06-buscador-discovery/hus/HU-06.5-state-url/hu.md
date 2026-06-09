# HU-06.5 — Estado del buscador sincronizado con URL

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** vecino
**Quiero** que mis filtros queden en la URL
**Para** compartir el link o usar back/forward sin perder estado

## Criterios de aceptación (Gherkin)

### Escenario: Filtros se reflejan en la URL
  Dado un vecino en `/search`
  Cuando aplica filtros `trade=gasfiter&commune=las-condes&min_rating=4`
  Entonces el `window.location.search` contiene esos query params

### Escenario: Recarga preserva estado
  Dado un usuario con `/search?trade=gasfiter&commune=las-condes` en la URL
  Cuando recarga la página
  Entonces los filtros aparecen aplicados al UI inicial

### Escenario: Back del navegador restaura filtros previos
  Dado el usuario aplicó filtros A y luego cambió a B
  Cuando presiona back
  Entonces ve los resultados de A nuevamente

## Tareas técnicas

- [ ] Hook cliente `src/components/search/useSearchState.ts` que sincroniza con `history.pushState`
- [ ] Hidratación SSR de filtros desde `Astro.url.searchParams` en `src/pages/search.astro`
- [ ] Tests `tests/e2e/search-url-state.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
