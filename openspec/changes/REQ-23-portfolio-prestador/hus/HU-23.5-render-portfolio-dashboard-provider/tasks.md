# HU-23.5 — Render galería editable en dashboard prestador

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-23-portfolio-prestador
**Rama:** `feat/HU-23.5-render-portfolio-dashboard-provider`

## Tareas técnicas

- [ ] **T1** Extender `src/components/portfolio/PortfolioGrid.astro` para soportar `editable={true}` con:
  - Header "Galería de Trabajos" + counter "Máx. {maxItems} fotos" (mockup `mockups/dashboard-provider.html:151-156`).
  - Grid `grid grid-cols-2 md:grid-cols-5 gap-3`.
  - Card con `<img>` + overlay hover con botón delete (`mockups/dashboard-provider.html:160-171`).
  - Slots "Vacío" para completar hasta `maxItems - 1` (`mockups/dashboard-provider.html:174-179`).
  - Si `items.length < maxItems`: botón Add con `<input type="file" accept="image/*">` (`mockups/dashboard-provider.html:182-185`).
  - Isla `<PortfolioGridIsland client:load>` con listeners delete, drag-drop y change.
- [ ] **T2** Componente `src/components/portfolio/PortfolioUploadSlot.astro` — encapsula botón Add para reuso interno.
- [ ] **T3** Componente `src/components/portfolio/PortfolioSpinner.astro` — spinner inline a escala del slot 24x24 (`animate-pulse`).
- [ ] **T4** Helper `src/lib/utils/portfolio-grid-state.ts` con `computeGridState(items, maxItems)` puro → `{cards, emptySlots, showAddButton}`. Reusado en SSR e isla.
- [ ] **T5** Página `src/pages/dashboard-provider.astro` (HU-12.1):
  - Reemplazar bloque mockup `mockups/dashboard-provider.html:151-187` por `<PortfolioGrid editable={true} items={items} maxItems={5} />`.
  - Carga inicial SSR con `getPortfolioUrls` (HU-23.4).
- [ ] **T6** Isla JS asociada:
  - Click delete → llama `deletePortfolioImage(id)` (HU-23.3). En 204 remueve card, agrega slot "Vacío", muestra Add si oculto.
  - Drag-drop sobre grid → al soltar calcula nuevo orden y llama `reorderPortfolio(ids)`. En 200 persiste; en error revierte.
  - Change input file → muestra spinner → llama `uploadPortfolioImage(file)` (HU-23.3). En 201 agrega card, decrementa slots, oculta Add si llega a 5. En 409 mensaje "máximo 5"; en 413/415 mensaje genérico.
  - Fallback accesible: botones "subir/bajar" con teclado para mover cards.
- [ ] **T7] Tests:
  - [ ] `tests/unit/portfolio/grid-state.test.ts` — `computeGridState`: slots vacíos = max - items.length - (hasAdd ? 1 : 0); hasAdd = items.length < max.
  - [ ] `tests/integration/portfolio/dashboard-render.test.ts` — SSR de `/dashboard-provider` incluye N cards reales + slots vacíos correctos.
  - [ ] `tests/e2e/dashboard-portfolio.spec.ts` (extender) — subir foto → aparece sin recarga; eliminar → desaparece; arrastrar → persiste; counter visual coherente; fallback teclado accesible.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `computeGridState`, no restar `hasAdd ? 1 : 0` → aparece botón Add visible + 5 cards, test unitario rojo (total > max) → restaurar
- [ ] Sabotaje 2: en la isla, no revertir el orden cuando reorder falla → usuario ve estado inconsistente, test E2E rojo → restaurar
- [ ] Sabotaje 3: omitir fallback accesible de teclado → Lighthouse a11y score cae, test E2E con tab+space rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/portfolio-grid-state.ts`
- [ ] Type check verde
- [ ] Commit `feat: galería editable dashboard prestador` y push