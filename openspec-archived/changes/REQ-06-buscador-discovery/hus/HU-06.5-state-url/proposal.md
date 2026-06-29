# Propuesta — HU-06.5 — Estado del buscador sincronizado con URL

**Estado:** propuesta | **REQ padre:** REQ-06-buscador-discovery

## Contexto

El vecino quiere poder compartir un link con sus filtros aplicados o
usar back/forward del navegador sin perder estado. La forma estándar
de esto es mantener los filtros como query params en la URL. Al cargar
la página, el front los lee; al cambiar filtros, los escribe vía
`history.pushState`. La hidratación SSR debe aplicar los filtros desde
`Astro.url.searchParams` para que el primer paint ya esté filtrado.

## Mockups de referencia

- HU sin mockup dedicado (búsqueda). El hero de `mockups/index.html:76-111` muestra los inputs que se sincronizan con URL.

## Alternativas consideradas

### Opcion A — Hidratación SSR desde `Astro.url.searchParams` + cliente `useSearchState` con `history.pushState`
- SSR lee `Astro.url.searchParams` y aplica filtros al primer render.
- Cliente: hook `useSearchState` mantiene `{ filters, setFilters }` y sincroniza con URL en cada cambio.
- Pro: primer paint ya filtrado (SEO-friendly, sin flicker).
- Pro: `pushState` permite back/forward sin reload.
- Contra: requiere coordinación SSR ↔ cliente; doble render si no se hace bien.

### Opcion B — Estado solo cliente (sin SSR de filtros)
- Front hace todo en JS; SSR muestra página "vacía".
- Pro: más simple.
- Contra: primer paint sin filtros (flicker); no compartible; rompe SEO.

### Opcion C — Persistir en `localStorage` en vez de URL
- Pro: el estado sobrevive a sesiones.
- Contra: no compartible; UX inconsistente entre dispositivos.

## Decision

Se elige **Opcion A**. Es el patrón estándar de "URL as state" y
mantiene SEO + shareability. La hidratación SSR es clave para evitar
flicker y para que la página sea crawleable.

## Riesgos y mitigaciones

- Riesgo: `pushState` no dispara evento `popstate` (sólo back/forward lo hace) → Mitigación: el hook dispara una llamada a `/api/v1/search` en cada cambio, sin esperar a popstate.
- Riesgo: SSR y cliente divergen en parsing de params → Mitigación: compartir la misma función `parseSearchParams(url.searchParams)` entre SSR y cliente.
- Riesgo: URL crece con muchos filtros activos → Mitigación: nombre de params cortos (`t` para trade, `c` para commune, `r` para min_rating, `v` para verified_only); documentado.

## Metrica de exito

- Filtros aplicados se reflejan en `window.location.search` (test E2E verifica `location.search`).
- Reload preserva el estado.
- Back/forward del navegador restaura filtros previos sin perder resultados.
- Hidratación SSR: primer HTML ya muestra resultados filtrados (no hay "Cargando..." después de aplicar filtros).
