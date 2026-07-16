# AdBanner lateral text rotation 90deg from 900px — Tasks

## Implementation

- [ ] **T1 [code, parallel_group: 1]** Agregar bloque CSS dentro del `@media (min-width: 900px)` para `.lateral-ad` en `src/pages/index.astro` que aplique `transform: rotate(-90deg)` y `transform-origin` al `:global(.ad-text)`. Criterio de done: el texto del banner rotado se ve en los laterales desde 900px en navegador desktop.
- [ ] **T2 [code, parallel_group: 1]** Agregar el mismo bloque dentro del `@media (min-width: 900px)` para `.lateral-ads` (sidebar en vista búsqueda). Criterio de done: los 2 banners del sidebar muestran texto rotado en `>=900px` cuando hay búsqueda activa.

## Tests

- [ ] **T3 [test, parallel_group: 2]** Verificación manual en navegador desktop (≥900px): banners laterales muestran texto rotado 90° legible. (CSS-only; no aplica test unitario — el AGENTS.md del proyecto prioriza tests de funcionalidad, no visuales.)
- [ ] **T4 [test, parallel_group: 2]** Verificación manual en viewport <900px: todos los banners (incluidos laterales) muestran texto horizontal.

## Sabotage

- [ ] **T5 [sabotaje, parallel_group: 3]** Revertir temporalmente el `transform: rotate(-90deg)` → confirmar visualmente que el texto vuelve a horizontal en los laterales; restaurar. Esto valida que la regla CSS está acoplada al selector y al breakpoint correctos (anti-falso-positivo).

## Documentation

- [ ] **T6 [docs, parallel_group: 4]** Commit con conventional commits en español y cuerpo de SDD mínimo (qué / por qué / riesgos / testing).
- [ ] **T7 [docs, parallel_group: 4]** Marcar la issue como `implemented` vía `domain_issue_set_status`.

## Verify

- [ ] **T8 [verify, parallel_group: 5 — siempre última]** Auditoría completa del change:
  1. `src/pages/index.astro` no supera 150 líneas de código nuevo.
  2. `src/components/home/AdBanner.astro` NO fue modificado (`git diff` confirma 0 cambios).
  3. Sin secretos hardcodeados.
  4. Sin N+1 queries (no aplica, es CSS).
  5. Convención del proyecto respetada (variables CSS usan design tokens ya existentes).
  6. Sin código muerto / debug.
  7. `git diff` final muestra solo cambios en `src/pages/index.astro`.