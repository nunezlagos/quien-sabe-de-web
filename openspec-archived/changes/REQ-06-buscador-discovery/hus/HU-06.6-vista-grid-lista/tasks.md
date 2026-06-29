# HU-06.6 — Switch grid/lista en resultados de búsqueda

**Estado:** planned → ready
**Prioridad:** P2
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.6-vista-grid-lista`

## Tareas tecnicas

- [ ] **T1** Componente `src/components/search/ResultCardGrid.astro` — replica estructura de `mockups/index.html:317-359` (avatar, badges, bio, tags servicios, precio).
- [ ] **T2** Componente `src/components/search/ResultCardList.astro` — fila horizontal con avatar pequeño + texto + precio derecha.
- [ ] **T3** Componente `src/components/search/ViewToggle.astro` — dos botones con `aria-pressed`, iconos `ri-grid-fill` / `ri-list-check`. Script inline (no Astro file script) que lee/escribe `localStorage` y hace swap de clase.
- [ ] **T4** Contenedor `src/components/search/ResultsContainer.astro` que envuelve la lista de items con clase `view-grid` o `view-list`. Acepta prop `initialView: 'grid' | 'list'` (default `grid`).
- [ ] **T5** Anti-flash: script inline en el `<head>` de `/search` que lee `localStorage.getItem('search.view')` y aplica la clase a `<body>` antes del primer paint.
- [ ] **T6** Preservar scroll position durante el swap (`window.scrollY` antes y `window.scrollTo` después).
- [ ] **T7** Analytics (si REQ-18 está mergeado): emitir evento `view_changed` con `view: 'grid'|'list'`.
- [ ] **T8** Tests:
  - [ ] `tests/e2e/search-view-toggle.spec.ts` — click "Lista" → class `view-list`; reload → sigue en lista; items count no cambia.
  - [ ] `tests/unit/components/view-toggle.test.ts` (si hay lógica testeable) — helpers de localStorage mockeado.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Quitar el `localStorage.setItem` del toggle → reload siempre vuelve a grid; test E2E de persistencia debe caer → restaurar.
- [ ] **S2** Cambiar la lógica de scroll preservation para que NO guarde `scrollY` → UX rota en páginas largas; test E2E que verifica posición post-swap debe caer → restaurar.
- [ ] **S3** Quitar el anti-flash del `<head>` → primer paint siempre en grid aunque preferencia sea lista; test E2E que mide el "primer paint" con performance API debe detectar el flash → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Tests Playwright `tests/e2e/search-view-toggle.spec.ts` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en componentes (medible via tests E2E y unit si aplica)
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
