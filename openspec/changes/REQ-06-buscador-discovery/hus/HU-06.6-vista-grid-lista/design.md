# Diseno tecnico — HU-06.6 — Switch grid/lista en resultados de búsqueda

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No aplica. Preferencia en `localStorage`.

## Contrato de API

No agrega endpoints. Consume `/api/v1/search` (HU-06.1+).

## Validaciones Zod

No aplica.

## Componentes UI

- `src/components/search/ViewToggle.astro` — dos botones (grid/list) con estado activo (`aria-pressed`). Iconos `ri-grid-fill`, `ri-list-check`.
- `src/components/search/ResultCardGrid.astro` — replica el template de `mockups/index.html:317-359` con avatar 64x64, badges, bio recortada, servicios como tags, precio.
- `src/components/search/ResultCardList.astro` — fila horizontal con avatar 48x48, nombre+oficio, badges, descripción corta, precio a la derecha.
- Lógica cliente (inline en `ViewToggle.astro` o `useViewPreference.ts`):
  - Lee `localStorage.getItem('search.view')` al mount.
  - `setView('list')` → toggle class en el contenedor, persiste en localStorage.
  - Preserva `scrollY` durante el swap.

## Flujo de interaccion (secuencial)

1. SSR renderiza la vista grid por default.
2. Cliente hidrata `useViewPreference`.
3. Si `localStorage.getItem('search.view') === 'list'` → swap a vista lista (preservando scroll).
4. Usuario clickea el toggle "Lista".
5. Script swap: `container.classList.replace('view-grid', 'view-list')`.
6. `localStorage.setItem('search.view', 'list')`.
7. Click en "Grid" → swap inverso + persiste `'grid'`.

## Capa de servicios

- Sin servicio de backend. Lógica cliente en componentes.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| E2E | `tests/e2e/search-view-toggle.spec.ts` | Click "Lista" → class `view-list`; reload → sigue en lista; items count no cambia entre vistas |
| Unit | `tests/unit/components/view-toggle.test.ts` (si hay lógica testeable) — helpers de localStorage mockeado |

## Dependencias y secuencia

- **Bloqueado por:** HU-06.1 (items con shape canónico), HU-06.5 (URL state y preferencia coexisten).
- **Bloquea a:** nada crítico.
- **Recursos compartidos:** componentes `ResultCardGrid`/`ResultCardList` que se usan también en otras HUs (REQ-11 dashboard vecino).

## Riesgos tecnicos

- Riesgo: el swap de clase CSS no funciona si las clases no tienen los mismos items hijos → Mitigación: el contenedor tiene un único `slot` con items; el cambio de clase sólo afecta estilos.
- Riesgo: `localStorage` lanza en modo privado (Safari) → Mitigación: `try/catch`; cae a default (grid).
- Riesgo: flash de grid al cargar si la preferencia es lista → Mitigación: script inline en `<head>` que lee `localStorage` antes del primer paint y aplica la clase correcta al `<html>` o `<body>`.
