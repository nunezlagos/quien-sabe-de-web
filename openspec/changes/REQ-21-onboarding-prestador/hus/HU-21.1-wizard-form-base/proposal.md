# Propuesta — HU-21.1 — Port del wizard create-trade desde mockup

**Estado:** propuesta | **REQ padre:** REQ-21-onboarding-prestador

## Contexto

El vecino que decide ofrecer sus servicios hoy no tiene una UI clara para arrancar: el flujo natural es "Crear Perfil PRO" en `mockups/dashboard-user.html:62`, pero el destino actual sólo enlaza a `mockups/create-trade.html` sin backend. Esta HU entrega el primer entregable del wizard: el port fiel del HTML del mockup a una vista Astro real en `/create-trade`, con los 3 bloques (Información Básica, Contacto y Precios, Verificación), los estilos `bg-white p-6 rounded-2xl shadow-sm border border-gray-100` y los botones Volver/Crear Perfil. Es 100% UI estática y no toca el endpoint de creación; el submit vive en HU-21.3.

## Mockups de referencia

- `mockups/create-trade.html:40-119` — estructura completa del wizard: hero (`líneas 42-48`), form (`línea 50`), 3 cards (`52-77`, `80-99`, `102-109`), botones (`111-116`).
- `mockups/dashboard-user.html:53-65` — CTA "Crear Perfil PRO" que enlaza a `/create-trade`. Mantener coherencia visual del card verde `bg-green-50`.
- `mockups/components/` — tokens compartidos (paleta primary `#2E8B57`, accent `#FF7F50`, font Nunito).

## Alternativas consideradas

### Opción A — Port directo del HTML a Astro, sin frameworks UI nuevos
- Vista `src/pages/create-trade.astro` + componente `ProviderWizard.astro` que reusa el HTML literal del mockup, sólo adaptando los `href` para navegación SPA.
- Pro: fidelidad visual 1:1 con `create-trade.html` (mismas clases Tailwind v4, mismos iconos Remix).
- Pro: cero dependencias UI adicionales; el markup ya pasó revisión de diseño.
- Contra: si el mockup cambia, el componente debe actualizarse a mano (mitigación: documentar en README que el mockup es la single source of truth).

### Opción B — Reescribir el form con FormKit o React Hook Form
- Pro: validación declarativa, manejo de errores nativo.
- Contra: introduce una dependencia pesada y rompe el principio "Astro primero" del proyecto. La validación se resuelve mejor en el cliente (HU-21.2) y servidor (HU-21.3) sin framework.

### Opción C — Convertir el form en pasos (multi-step wizard)
- Pro: UX más guiada para usuarios no técnicos.
- Contra: el mockup ya lo presenta como form único (un solo `action`, un solo submit). Multi-step implicaría mockup nuevo y refactor mayor; queda fuera del scope de esta HU.

## Decisión

Se elige **Opción A**. El mockup está aprobado y la meta de esta HU es entregar la vista navegable; la lógica de captura y submit llega en HU-21.2 y HU-21.3. Mantener paridad con el HTML reduce riesgo de regresión visual y permite que el equipo de diseño revise diffs pequeños por HU.

## Riesgos y mitigaciones

- Riesgo: discrepancia entre mockup y vista Astro por conversión manual → Mitigación: capturar screenshot del mockup y la vista renderizada, comparar en PR.
- Riesgo: campo "Otro" del select (mockup línea 69) sin manejo → Mitigación: HU-21.2 habilita el input free-text al elegir "Otro"; esta HU sólo deja el `<option>` presente.
- Riesgo: pérdida de responsive `md:grid-cols-2` → Mitigación: tests E2E Playwright con viewport 375px verifican colapso a 1 columna.

## Métrica de éxito

- `GET /create-trade` (logueado) renderiza los 3 cards en orden con sus headings `1. Información Básica`, `2. Contacto y Precios`, `3. Verificación`.
- El botón "Volver" navega a `/dashboard-user`; "Crear Perfil" es `type="submit"` con `formaction` apuntando al endpoint de HU-21.3.
- Test E2E Playwright en viewport 375×667 muestra 1 columna en los 3 grids; en 1280×800 muestra 2 columnas.
- Sabotaje: borrar el `class="bg-white p-6 rounded-2xl ..."` de uno de los cards → snapshot Playwright diff lo detecta → restaurar.