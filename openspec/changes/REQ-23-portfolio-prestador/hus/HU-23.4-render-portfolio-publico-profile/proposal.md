# Propuesta — HU-23.4 — Render del portfolio público en profile.html

**Estado:** propuesta | **REQ padre:** REQ-23-portfolio-prestador

## Contexto

El vecino visita `/p/:slug` y necesita ver fotos reales de trabajos para decidir contratar (OE1: confianza). El mockup tiene el contenedor `#profile-portfolio-container` y los templates listos en `mockups/profile.html:146-148, 179-189`, pero hoy los datos vienen del array hardcodeado de `mockups/js/data.js:36-40`. Hay que sustituir con render SSR desde D1, manteniendo el markup exacto del mockup.

## Mockups de referencia

- `mockups/profile.html:141-149` — sección "Trabajos" con `<h2>` icono `ri-image-line` y contenedor `#profile-portfolio-container`.
- `mockups/profile.html:179-182` — template `portfolio-grid-template` con `grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 portfolio-grid`.
- `mockups/profile.html:184-189` — template `portfolio-item-template` con `<img class="...portfolio-img">` y overlay hover `bg-black/0 group-hover:bg-black/10`.
- `mockups/js/data.js:36-40` — modelo mock actual a reemplazar.
- `mockups/js/profile.js` — referencia para entender cómo el cliente hidrata hoy con los templates (lógica a portar a SSR).

## Alternativas consideradas

### Opción A — SSR puro desde Astro con Drizzle en el frontmatter
- Descripción: `/p/[slug].astro` carga las imágenes via `getPortfolioUrls(providerId, env)` en el frontmatter y emite el grid ya renderizado, eliminando los `<template>` del mockup.
- Pro: HTML completo desde el primer byte, ideal SEO, cero JS para la galería.
- Contra: si el vecino sube/borra durante la visita no se refresca (no aplica en perfil público).

### Opción B — SSR del shell + fetch al endpoint `GET /api/v1/providers/:id/portfolio`
- Descripción: mantener los `<template>` y hidratar como en el mockup.
- Pro: cliente reusa código existente del mockup.
- Contra: doble request, peor LCP, contradice el criterio "Render público SSR en profile.html sustituye datos mock" (`req.md:22`).

### Opción C — Worker que reescribe el mockup HTML tal cual con HTMLRewriter
- Descripción: usar `HTMLRewriter` para inyectar `<img>` dentro de `#profile-portfolio-container` sobre el HTML del mockup.
- Pro: cambios mínimos.
- Contra: acopla a la estructura exacta del mockup, dificulta migrar a componentes Astro reutilizables.

## Decisión

Se adopta la **Opción A**. El render público debe ser SSR completo desde Astro (`output: 'server'` con adapter Cloudflare). El HTML emitido respeta exactamente las clases del template `portfolio-item-template` (`mockups/profile.html:184-189`) para reutilizar el CSS del mockup.

## Riesgos y mitigaciones

- Riesgo: URL R2 vs MinIO difiere por entorno → mitigación: helper `getPortfolioUrls` resuelve la URL final según `Astro.locals.runtime.env` (CDN R2 en prod, `http://localhost:9002/...` en dev).
- Riesgo: prestador sin imágenes deja la sección vacía y rota visualmente → mitigación: empty state `<EmptyPortfolio />` con texto "Aún no hay trabajos cargados" según `hu.md:21`.
- Riesgo: latencia adicional por query D1 → mitigación: edge cache `Cache-Control: public, max-age=60, s-maxage=60`.

## Métrica de éxito

- Vista `/p/juan-perez-gasfiter` muestra el HTML con `<img>` en el server-rendered y sin esperar a JS.
- Segundo request al mismo perfil cae en edge cache (header `cf-cache-status: HIT`).
- Prestador con 0 imágenes ve el empty state, no el grid vacío.
