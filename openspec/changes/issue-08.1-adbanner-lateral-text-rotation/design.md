# AdBanner lateral text rotation 90deg from 900px — Design

## Decisions

### DEC-1: Usar `:global(.ad-text)` para escapar el scope de Astro

Astro escopea automáticamente los estilos de un componente. El
`.ad-text` está dentro del componente `AdBanner.astro`. Para alcanzarlo
desde `src/pages/index.astro` se usa el pseudo-selector `:global(.ad-text)`
que Astro reconoce y emite sin prefijo de scope.

**Alternativas evaluadas:**
- Modificar `AdBanner.astro` con un prop `rotated: boolean` →
  acoplaría el componente al contexto de uso, rompiendo su agnosticidad.
  Descartado por violar el non-goal MUST-2 de la spec.
- Crear un wrapper component `LateralAdBanner.astro` →
  sobre-ingeniería para un cambio puramente visual de 5 líneas. YAGNI.

**Tradeoff:** un selector `:global` requiere disciplina (encadenar bajo
contenedor específico) para no contaminar otros `.ad-text` no laterales.

**Pattern aplicado:** Container-Responsive Styling (CSS contextual al
padre, agnóstico al hijo).

## Alternatives

### Wrapper component con prop `rotated`

Pro: type-safe, fácil de razonar, testeable.
Con: duplica lógica del banner, exige migración de callers, contraviene
el MUST-2 (no tocar `AdBanner.astro`).

### CSS variable `--ad-text-rotated` seteada por el contenedor

Pro: declarativo, scoped via custom property.
Con: requiere definir `--ad-text-rotated` en cada contenedor lateral;
más boilerplate que un único selector `:global()`.

### CSS condicional con `:has()` selector

Pro: poderoso, evita wrappers.
Con: soporte de browser aún parcial (Firefox antes de 121); no
justifica el riesgo para un cambio cosmetic.

## Data Flow

```
[lateral-ad container]
       │ (≥900px)
       ▼
  CSS @media query
       │
       ▼
  .lateral-ad :global(.ad-text) { transform: rotate(-90deg) }
       │
       ▼
  Texto del AdBanner rotado 90deg en laterales
```

## TDD Plan

Por la naturaleza CSS-visual del cambio, no aplica el ciclo TDD
tradicional (Red→Green→Refactor→Sabotaje) sobre funciones. En su lugar,
se aplica verificación visual + sabotaje manual:

1. **Verificación happy path:**
   - En viewport 1200x800, abrir la home en modo no-búsqueda.
   - Confirmar que el banner lateral izquierdo muestra el texto rotado
     90° legible.
   - Confirmar el banner lateral derecho idem.
2. **Sabotaje:** revertir el `transform: rotate(-90deg)` →
   confirmar que el texto vuelve a horizontal — esto valida que el
   selector y la regla están acoplados al comportamiento esperado.
3. **Edge case:** abrir en viewport 800x600 (<900px) → confirmar que
   TODOS los banners (incluidos laterales) muestran texto horizontal.

## Risk Mitigation

| Risk | Mitigation |
| --- | --- |
| Texto rotado se corta o desborda. | Verificación visual + ajustar `width` del contenedor lateral / agregar `white-space: nowrap` si hace falta (iteración 2). |
| `:global` captura banners no laterales. | Especificidad alta vía `.lateral-ad :global(.ad-text)` y `.lateral-ads :global(.ad-text)`. Adicionalmente `.lateral-ad` y `.lateral-ads` ya tienen `display: block` solo en `@media (min-width: 900px)`, lo que limita el efecto al contexto correcto. |
| Cambio CSS rompe el layout del banner. | El `transform` no afecta el box layout, solo visual. No afecta a `.cards-with-ads`, `.sidebar-col` ni al grid. |