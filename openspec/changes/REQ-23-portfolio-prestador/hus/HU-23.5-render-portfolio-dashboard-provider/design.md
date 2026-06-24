# Diseño técnico — HU-23.5 — Render galería editable en dashboard prestador

**REQ padre:** REQ-23-portfolio-prestador

## Modelo de datos

Sólo lectura sobre `portfolio_images` (HU-23.1). Las mutaciones pasan por endpoints definidos en HU-23.2 y HU-23.3.

## Contrato de API

No expone endpoints nuevos. Consume:

| Endpoint | Definido en | Uso |
|---|---|---|
| `POST /api/v1/providers/me/portfolio` | HU-23.2 | Subir nueva foto |
| `PATCH /api/v1/providers/me/portfolio/reorder` | HU-23.3 | Reordenar grid |
| `DELETE /api/v1/providers/me/portfolio/:id` | HU-23.3 | Eliminar foto |

## Validaciones Zod

No aplica (no expone input externo). La validación de archivo se hace en HU-23.2.

## Componentes UI

### Páginas Astro

- `src/pages/dashboard-provider.astro` — frontmatter carga `getPortfolioUrls(providerId, env)` (servicio de HU-23.4) y pasa al componente. Reemplaza el bloque `mockups/dashboard-provider.html:151-187` por `<PortfolioGrid editable={true} />`.
- Mockup base: `mockups/dashboard-provider.html:148-187`.

### Componentes Astro reutilizables

- `src/components/portfolio/PortfolioGrid.astro` (compartido con HU-23.4)
  - Props: `{ items: Array<{ id, url, sortOrder }>, editable: boolean, maxItems: number }`
  - Cuando `editable=true`:
    - Header con label "Galería de Trabajos" + counter "Máx. {maxItems} fotos" (`mockups/dashboard-provider.html:151-156`).
    - Grid `grid grid-cols-2 md:grid-cols-5 gap-3`.
    - Por cada item: card con `<img>` + overlay hover con `<button>` que dispara delete (`mockups/dashboard-provider.html:160-171`).
    - Slots "Vacío" para completar hasta `maxItems - 1` (`mockups/dashboard-provider.html:174-179`).
    - Si `items.length < maxItems`: botón Add con `<input type="file" accept="image/*">` (`mockups/dashboard-provider.html:182-185`).
  - Islas requeridas: sí. Una isla `<PortfolioGridIsland client:load>` adjunta listeners de delete, drag-drop y change del input file.
- `src/components/portfolio/PortfolioUploadSlot.astro` — encapsula el botón Add para reuso interno.
- `src/components/portfolio/PortfolioSpinner.astro` — spinner inline siguiendo el patrón de `mockups/index.html:23-33`.

## Flujo de interacción (secuencial)

### Upload desde dashboard
1. Prestador selecciona archivo en `<input type="file" accept="image/*">` (`mockups/dashboard-provider.html:184`).
2. La isla reemplaza el botón Add por un slot con spinner (`PortfolioSpinner`).
3. Cliente JS invoca `uploadPortfolioImage(file)` de `src/lib/client/portfolio.ts` (HU-23.2/23.3).
4. Al recibir 201, la isla agrega una nueva card al grid, decrementa el contador de slots "Vacío", y si `items.length === 5` oculta el botón Add.
5. En error 409 muestra mensaje "máximo 5 imágenes"; en 413/415 muestra mensaje genérico.

### Delete desde dashboard
1. Prestador hace clic en `<i class="ri-delete-bin-line">` (`mockups/dashboard-provider.html:163`).
2. La isla llama `deletePortfolioImage(id)`.
3. Al recibir 204, remueve la card, añade un slot "Vacío" al final y vuelve a mostrar el botón Add si estaba oculto.

### Reorder desde dashboard
1. Prestador arrastra card sobre el grid `grid-cols-2 md:grid-cols-5`.
2. Al soltar, la isla calcula nuevo orden y llama `reorderPortfolio(ids)`.
3. Al recibir 200, persiste el orden visual. En error revierte al orden previo.

## Capa de servicios

- `src/lib/services/portfolio/render.ts` — reusa `getPortfolioUrls` (HU-23.4).
- `src/lib/client/portfolio.ts` — reusa funciones definidas en HU-23.3 (`upload`, `delete`, `reorder`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/portfolio/grid-state.test.ts` | Lógica derivada: slots vacíos = `max - items.length - (hasAdd ? 1 : 0)`; hasAdd = `items.length < max` |
| Integración | `tests/integration/portfolio/dashboard-render.test.ts` | SSR de `/dashboard-provider` incluye N cards reales + slots vacíos correctos |
| E2E | `tests/e2e/dashboard-portfolio.spec.ts` | Subir foto → aparece sin recarga; eliminar → desaparece; arrastrar → persiste; counter visual coherente |

## Dependencias y secuencia

- **Bloqueado por:** HU-23.1, HU-23.2, HU-23.3, HU-23.4 (reusa componente).
- **Bloquea a:** —
- **Recursos compartidos:** binding `DB`, cliente JS `src/lib/client/portfolio.ts`, componente `PortfolioGrid.astro`.

## Riesgos técnicos

- Riesgo: hidratación con `client:load` carga JS en todo el dashboard → mitigación: aislar la isla únicamente al componente `PortfolioGrid` y no envolver toda la página.
- Riesgo: drag-drop nativo HTML5 mal soportado en móviles → mitigación: usar Pointer Events + handles "subir/bajar" como fallback teclado/táctil.
- Riesgo: discrepancia visual con el mockup al refactorizar → mitigación: tests E2E afirman presencia de clases `grid-cols-2 md:grid-cols-5 gap-3`, `border-dashed border-gray-200` y textos "Máx. 5 fotos" / "Vacío".
- Riesgo: spinner basado en page-loader del index puede ser visualmente demasiado pesado para un slot 24x24 → mitigación: `PortfolioSpinner` adopta el ritmo `animate-pulse` pero a escala del slot, no la marca completa.
