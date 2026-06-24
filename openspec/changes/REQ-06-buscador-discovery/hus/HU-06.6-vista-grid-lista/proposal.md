# Propuesta — HU-06.6 — Switch grid/lista en resultados de búsqueda

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

El vecino quiere alternar entre vista grid (cards compactas) y vista
lista (filas con más detalle) según le resulte más cómodo revisar la
lista de prestadores. La preferencia se persiste en `localStorage` con
clave `search.view` para que sobreviva entre sesiones. Cambiar de
vista NO debe cambiar los resultados ni los filtros — sólo el layout.

## Mockups de referencia

- `mockups/index.html:144-151` — toggle grid/lista con `<button id="grid-view-btn">` y `<button id="list-view-btn">` (iconos `ri-grid-fill`, `ri-list-check`). El componente `ViewToggle.astro` replica este patrón.
- `mockups/index.html:317-359` — `grid-card-template` con avatar grande + nombre + oficio + badges + bio + servicios. La vista grid usa este template.
- Vista lista no tiene mockup dedicado; se diseña con filas horizontales (`flex` con `avatar` + `text-block` + `price`).

## Alternativas consideradas

### Opcion A — Componente `ViewToggle` + dos variantes `ResultCardGrid` y `ResultCardList`, preferencia en `localStorage`
- Toggle muestra grid/list. Al click, swap el contenedor + guarda en `localStorage`.
- Pro: zero impacto en backend; sólo afecta presentación.
- Pro: persistencia cross-session via localStorage.
- Contra: requiere JS mínimo para el swap; usuarios con JS deshabilitado ven sólo la vista por default.

### Opcion B — Vista persistente via cookie + SSR detecta preferencia
- Server lee cookie y renderiza la variante correcta en SSR.
- Pro: no requiere JS.
- Contra: una cookie más; complica el modelo (la preferencia cambia rápido, cookie se setea en cada click).

### Opcion C — Sin persistencia, default grid
- Más simple.
- Contra: cada visita arranca en grid, frustra al usuario que prefiere lista.

## Decision

Se elige **Opcion A**. Es la opción estándar, simple, y la persistencia
en `localStorage` es la práctica habitual. La vista default es grid;
los usuarios que prefieren lista lo setean una vez y queda.

## Riesgos y mitigaciones

- Riesgo: `localStorage` no disponible en SSR → Mitigación: el toggle es client-side; el SSR siempre renderiza grid (default), el cliente re-renderiza a lista si la preferencia está guardada.
- Riesgo: cambio de vista rompe scroll position → Mitigación: preservar `window.scrollY` antes del swap y restaurar después.
- Riesgo: el cambio de vista afecta métricas (clicks, conversiones) y se mezcla con el efecto de los filtros → Mitigación: enviar evento a analytics (REQ-18) con `view_changed` para segmentar.

## Metrica de exito

- Click en "Lista" → items se renderizan en filas (test E2E verifica CSS class `view-list` en el contenedor).
- `localStorage.getItem('search.view') === 'list'` tras click.
- Reload → vista arranca en "lista" sin flash visible de grid.
- Los items son los mismos antes y después del toggle (sólo cambia el layout).
