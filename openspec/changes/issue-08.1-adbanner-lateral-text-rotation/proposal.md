# AdBanner lateral text rotation 90deg from 900px — Proposal

**REQ padre:** REQ-08-ux-ads
**Esfuerzo estimado:** S (<1 día)
**Tipo:** feature

## Why

En desktop, los slots laterales del home (`.lateral-ad` y `.lateral-ads`)
tienen 120px de ancho y gran altura. El texto del banner ocupa apenas
el inicio del contenedor dejando mucho espacio vertical desaprovechado.
Rotar el texto 90° aprovecha ese ancho y hace el banner más visible.

## Scope

**In:**
- Bloque CSS dentro del `@media (min-width: 900px)` para `.lateral-ad`
  en `src/pages/index.astro` (selector `:global(.ad-text)` con
  `transform: rotate(-90deg)` y `transform-origin` adecuado).
- Mismo trato para `.lateral-ads` (sidebar en vista búsqueda).

**Out (justificado):**
- `src/components/home/AdBanner.astro`: el componente debe quedar
  agnóstico al contexto de uso. El cambio de rotación es responsabilidad
  del contenedor.
- Paleta, gradiente, icono, badge del banner: son del componente, fuera
  de scope.
- Breakpoints o layout responsive: 900px ya está establecido.
- Animaciones / hover al texto rotado: queda como MAY para iteraciones.
- Tests E2E con Playwright: el AGENTS.md prioriza tests de funcionalidad,
  no visuales; verificación manual en navegador es suficiente.

## Approach

1. Localizar los bloques `@media (min-width: 900px)` en
   `src/pages/index.astro` que ya definen `.lateral-ad` y
   `.sidebar-col`/`.lateral-ads`.
2. Agregar dentro de cada bloque un selector anidado que apunte a
   `:global(.ad-text)` con `transform: rotate(-90deg)` y un
   `transform-origin` que centre la rotación en el contenedor.
3. Verificar manualmente en navegador desktop (≥900px) que el texto
   rotado se lea correctamente y no desborde el slot lateral.
4. Si hace falta, ajustar `width` del contenedor lateral o agregar
   `white-space` según evidencia visual.

## Risks

| Risk | Mitigation |
| --- | --- |
| Texto rotado desborda el slot lateral de 120px o queda ilegible si `.ad-text` es largo. | Usar `white-space: nowrap` y ajustar `width`/`height` del contenedor lateral según evidencia visual; iterar con MAY-1 si no alcanza. |
| El selector `:global(.ad-text)` podría capturar `.ad-text` de banners no laterales si la especificidad no es suficiente. | Encadenar el selector bajo `.lateral-ad` y `.lateral-ads` (que ya tienen `display: block` solo en `>=900px`) para que la especificidad acote el efecto a los laterales. |

## Testing

- Verificación manual en navegador desktop (≥900px):
  - Banners laterales (`lateral-ad-left`, `lateral-ad-right` y `lateral-ads`)
    muestran texto rotado.
  - Banner del hero (`.ad-section`) y `mobile-ad` mantienen texto horizontal.
- DevTools (modo responsive): comprobar que en viewport <900px todos los
  banners muestran texto horizontal.
- Inspección CSS: confirmar que el `transform` se aplica solo dentro de
  `.lateral-ad` / `.lateral-ads` y solo en `@media (min-width: 900px)`.