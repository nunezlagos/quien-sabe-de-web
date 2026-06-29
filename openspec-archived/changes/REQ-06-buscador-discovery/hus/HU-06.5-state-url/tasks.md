# HU-06.5 — Estado del buscador sincronizado con URL

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.5-state-url`

## Tareas tecnicas

- [ ] **T1** Helpers `parseSearchParams(searchParams)` y `serializeSearchParams(params)` en `src/lib/utils/searchUrl.ts`. Nombres cortos: `t`, `c`, `r`, `v`, `p`, `l`, `s`. Validación con `searchParamsSchema` (HU-06.1/06.2).
- [ ] **T2** Hook cliente `src/components/search/useSearchState.ts` (TypeScript puro, no Astro) que mantiene estado y sincroniza con `history.pushState` y `popstate`.
- [ ] **T3** Página `src/pages/search.astro` que lee `Astro.url.searchParams` en SSR, hace fetch server-side a `/api/v1/search` con los params, y renderiza el HTML ya filtrado.
- [ ] **T4** Componente `src/components/search/SearchResults.astro` que recibe `items` y los renderiza (delegando a las variantes grid/lista de HU-06.6).
- [ ] **T5** Componente `src/components/search/Filters.astro` con inputs (`<select>`, `<input type="number">`) que llaman `setFilters` del hook.
- [ ] **T6** Hidratación cliente: `useSearchState` lee `window.location.search` al montar y verifica coherencia con SSR.
- [ ] **T7** Tests:
  - [ ] `tests/unit/utils/searchUrl.test.ts` — round-trip; defaults; inválidos caen a default.
  - [ ] `tests/integration/search/url-params.test.ts` — `/api/v1/search?t=gasfiter&c=las-condes&r=4` con params cortos.
  - [ ] `tests/e2e/search-url-state.spec.ts` — aplicar filtros, URL cambia, reload preserva, back restaura.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar `serializeSearchParams` para que NO incluya `verified_only` cuando es true (default) → URL no contiene `v` → al recargar, server asume default true y no hay bug visible; sabotaje改为: cambiar para que serialice `verified_only` como `v=false` cuando es true (invertido) → `tests/integration/search/url-params.test.ts` debe caer → restaurar.
- [ ] **S2** Quitar el `pushState` del hook → URL no cambia al aplicar filtros; test E2E debe caer → restaurar.
- [ ] **S3** Cambiar la SSR para que lea params con nombres largos (`trade=`) en vez de cortos (`t=`) → `tests/e2e/search-url-state.spec.ts` debe caer al compartir URL con nombres cortos → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Tests Playwright `tests/e2e/search-url-state.spec.ts` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/utils/searchUrl.ts` y `useSearchState.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
