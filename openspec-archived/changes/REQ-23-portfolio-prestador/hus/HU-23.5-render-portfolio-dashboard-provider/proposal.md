# Propuesta — HU-23.5 — Render galería editable en dashboard prestador

**Estado:** propuesta | **REQ padre:** REQ-23-portfolio-prestador

## Contexto

El prestador necesita ver y gestionar sus fotos en una vista cómoda dentro del dashboard, integrando upload (HU-23.2), reorder y delete (HU-23.3) sobre datos persistidos (HU-23.1). El mockup ya define el layout exacto en `mockups/dashboard-provider.html:148-187` con slots vacíos y botón Add condicional; falta portarlo a Astro y conectarlo a los endpoints reales (OE1: agencia del prestador sobre su perfil).

## Mockups de referencia

- `mockups/dashboard-provider.html:151-156` — header "Galería de Trabajos" + counter "Máx. 5 fotos".
- `mockups/dashboard-provider.html:158` — grid `grid grid-cols-2 md:grid-cols-5 gap-3`.
- `mockups/dashboard-provider.html:160-171` — card con imagen + overlay delete `<i class="ri-delete-bin-line">`.
- `mockups/dashboard-provider.html:174-179` — slot "Vacío" con `bg-gray-50 rounded-xl border-2 border-dashed border-gray-200`.
- `mockups/dashboard-provider.html:182-185` — botón upload "+" con `<i class="ri-add-line">` e input file oculto.
- `mockups/index.html:23-33` — patrón de spinner page-loader a reutilizar como indicador de subida.

## Alternativas consideradas

### Opción A — SSR del shell + isla pequeña que maneja upload/delete/reorder
- Descripción: Astro renderiza el grid con datos reales en el frontmatter; una isla TS (`client:load`) intercepta clicks de delete, drag-drop y change del input file.
- Pro: HTML correcto desde el primer byte, JS mínimo solo donde hay interacción.
- Contra: requiere coordinar estado entre HTML SSR y la isla.

### Opción B — Página totalmente cliente que llama `GET /api/v1/providers/me/portfolio`
- Descripción: mismo patrón que el mockup actual (templates + JS).
- Pro: paridad 1:1 con el mockup.
- Contra: dashboard ya está autenticado y SSR, hacer fetch extra es regresión; LCP peor.

### Opción C — Endpoint que devuelve HTML parcial (HTMX-like)
- Descripción: cada acción devuelve el grid completo renderizado.
- Pro: sin estado en cliente.
- Contra: introduce un patrón distinto al resto del proyecto, no hay HTMX en el stack.

## Decisión

Se adopta la **Opción A**. Aprovecha SSR con datos reales, reutiliza el componente `PortfolioGrid.astro` con prop `editable=true`, y delega interacciones a `src/lib/client/portfolio.ts` (definido en HU-23.3). El grid renderizado respeta exactamente el HTML del mockup para preservar el CSS.

## Riesgos y mitigaciones

- Riesgo: drag-drop no funciona en mobile-first → mitigación: añadir handles "subir/bajar" como fallback accesible, manteniendo drag-drop en desktop.
- Riesgo: upload concurrente vs delete deja el grid en estado inconsistente → mitigación: deshabilitar botones durante operaciones en vuelo y refetch tras éxito/error.
- Riesgo: el counter "Máx. 5 fotos" no se actualiza tras upload/delete → mitigación: derivar visualmente de `items.length` en cliente, no de un texto estático.

## Métrica de éxito

- Prestador con 2 fotos ve 2 cards reales + 2 slots "Vacío" + 1 botón Add (exactamente lo descrito en `hu.md:21-23`).
- Tras subir, la nueva card aparece sin recarga, un slot "Vacío" desaparece y si llega a 5 el botón Add se oculta.
- Tras eliminar, la card se quita, aparece un slot "Vacío" y el botón Add vuelve si había 5.
- Durante upload el slot muestra spinner reutilizando el estilo de `mockups/index.html:23-33`.
