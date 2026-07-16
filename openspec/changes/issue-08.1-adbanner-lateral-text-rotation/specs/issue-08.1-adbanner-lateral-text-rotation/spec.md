# issue-08.1-adbanner-lateral-text-rotation

## Purpose

Rotar 90° el texto del AdBanner solo en las instancias laterales del
home (`.lateral-ad` y `.lateral-ads`) desde el breakpoint 900px,
aprovechando el ancho vertical del slot lateral. El componente
`AdBanner.astro` permanece agnóstico al contexto.

## Requirements

### MUST

- MUST-1: En viewport ≥ 900px, el `.ad-text` dentro de `.lateral-ad`,
  `.lateral-ad-left`, `.lateral-ad-right` y `.lateral-ads` DEBE estar
  rotado 90 grados via `transform: rotate(-90deg)` (o equivalente que
  rote el texto).
- MUST-2: El componente `src/components/home/AdBanner.astro` NO DEBE
  modificarse. El cambio de CSS vive en `src/pages/index.astro`.
- MUST-3: En viewport < 900px, el `.ad-text` DEBE permanecer horizontal
  en todas las instancias.
- MUST-4: El banner del hero (`.ad-section`) y el `mobile-ad` NO DEBEN
  rotar su texto en ningún breakpoint.

### SHOULD

- SHOULD-1: El `transform-origin` DEBE permitir que el texto rotado se
  lea de forma legible dentro del slot lateral.

### MAY

- MAY-1: Ajustar `width` del contenedor lateral si la rotación lo
  requiere.

#### Scenario: Banner lateral izquierdo en desktop muestra texto rotado

Given que el viewport es ≥ 900px y estoy en la home en modo no-búsqueda
When la página renderiza el lateral izquierdo
Then el `.ad-text` del banner lateral izquierdo tiene `transform: rotate(-90deg)` aplicado y se lee vertical.

#### Scenario: Banner lateral derecho en desktop muestra texto rotado

Given que el viewport es ≥ 900px y estoy en la home en modo no-búsqueda
When la página renderiza el lateral derecho
Then el `.ad-text` del banner lateral derecho tiene `transform: rotate(-90deg)` aplicado y se lee vertical.

#### Scenario: Banners del sidebar en búsqueda muestran texto rotado

Given que el viewport es ≥ 900px y estoy en la home con búsqueda activa
When la página renderiza el sidebar con 2 banners
Then los 2 `.ad-text` dentro de `.lateral-ads` tienen `transform: rotate(-90deg)` aplicado.

#### Scenario: Banner del hero mantiene texto horizontal en cualquier breakpoint

Given que estoy en cualquier viewport
When la página renderiza el banner del hero (`.ad-section`)
Then el `.ad-text` del banner del hero NO tiene `transform` aplicado y se lee horizontal.

#### Scenario: Mobile ad mantiene texto horizontal en cualquier breakpoint

Given que estoy en cualquier viewport
When la página renderiza el `mobile-ad`
Then el `.ad-text` del `mobile-ad` NO tiene `transform` aplicado y se lee horizontal.

#### Scenario: En móvil (<900px) todos los banners son horizontales

Given que el viewport es < 900px
When la página renderiza cualquier banner
Then ningún `.ad-text` tiene `transform: rotate` aplicado y todos se leen horizontales.

#### Scenario: El componente AdBanner.astro no fue modificado

Given que el change está aplicado
When reviso `git diff src/components/home/AdBanner.astro`
Then el archivo no tiene cambios respecto al commit anterior.

## Non-goals

- Modificar el componente `AdBanner.astro`.
- Cambiar el diseño visual del banner (gradiente, paleta, icono, badge).
- Cambiar el layout responsive (breakpoints, anchos de columna).
- Agregar animaciones o transiciones al texto rotado.

## Out of scope

- Tests E2E con Playwright (cambio CSS visual; verificación manual es suficiente y el AGENTS.md del proyecto prioriza tests de funcionalidad).
- Internacionalización del texto del banner.
- Cambios en la home mobile.

## Resumen

CSS-only change en `src/pages/index.astro`: aplica `transform: rotate(-90deg)`
al `.ad-text` (via `:global(.ad-text)` para escapar el scope de Astro)
únicamente dentro de `.lateral-ad`, `.lateral-ad-left`, `.lateral-ad-right`
y `.lateral-ads` desde el breakpoint 900px. El componente `AdBanner.astro`
queda intacto, manteniendo su agnosticidad al contexto de uso.