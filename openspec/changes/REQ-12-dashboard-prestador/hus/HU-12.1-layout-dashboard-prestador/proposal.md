# Propuesta — HU-12.1 — Layout dashboard prestador con sidebar y tabs

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita una superficie privada y persistente para operar su perfil, ver métricas, gestionar servicios y reseñas tras autenticarse. Esto sustenta OE1 (visibilidad y operación del prestador) al ofrecer un único punto de entrada post-login con redirect determinístico y control de acceso por rol.

## Mockups de referencia

- `mockups/dashboard-provider.html:15-28` — barra superior con marca, notificaciones y salir.
- `mockups/dashboard-provider.html:30-66` — grid principal `grid-cols-1 md:grid-cols-4` con `aside` sidebar.
- `mockups/dashboard-provider.html:34-45` — tarjeta de perfil resumen del prestador (avatar, nombre, oficio, rating).
- `mockups/dashboard-provider.html:47-65` — bloque `<nav>` con toggle "Disponible" y links: Resumen, Editar Perfil, Mis Servicios, Reseñas, Soporte/Ayuda.
- `mockups/dashboard-provider.html:68-75` — botón "Previsualizar Perfil Público" en cabecera del panel principal.
- `mockups/dashboard-provider.html:354-359` — banner "Consejo Pro" (slot inferior del panel).

## Alternativas consideradas

### Opcion A — Single page con secciones ancladas (`#resumen`, `#perfil`, `#servicios`, `#resenas`)
- Una sola ruta `/dashboard-provider` que renderiza todas las secciones y usa anchors para scroll/highlight.
- Pro: una sola request SSR, menos latencia al cambiar de tab, alinea con el mockup actual que ya muestra todo en una página.
- Contra: payload inicial mayor, riesgo de cargar datos no usados, navegación menos limpia.

### Opcion B — Rutas por sección (`/dashboard-provider/resumen`, `/dashboard-provider/perfil`, ...)
- Cada sección en una ruta Astro independiente con layout compartido.
- Pro: payload por sección, deep-linking limpio, fácil de cachear.
- Contra: más archivos, mockup actual no separa secciones físicamente, transiciones requieren navegación completa.

## Decision

Se adopta **Opcion A** porque el mockup ya entrega todo el contenido en una sola vista densa y la complejidad de páginas separadas no se justifica para 4 secciones acotadas. Las secciones se montan como islas que cargan datos bajo demanda; el sidebar usa `aria-current="page"` sobre el `<a href="#perfil">` activo.

## Riesgos y mitigaciones

- Riesgo: tamaño del DOM crece al sumar HUs siguientes. Mitigación: cada sección es un componente Astro propio, secciones pesadas (servicios, reseñas) se hidratan con `client:visible`.
- Riesgo: acceso a `/dashboard-provider` por usuarios sin rol prestador. Mitigación: middleware `requireRole('prestador')` aplicado a la ruta antes del render.
- Riesgo: regresión visual al refactor. Mitigación: snapshot E2E del layout (Playwright) sobre el mockup como baseline.

## Metrica de exito

- Tras login de un prestador autenticado, se llega a `/dashboard-provider` con HTTP 200 y sidebar visible con los 4 links + soporte.
- Un usuario no autenticado o con rol distinto recibe `302` hacia `/login?next=/dashboard-provider`.
- E2E Playwright valida presencia de los anchors `#resumen`, `#perfil`, `#servicios`, `#resenas` y del CTA "Previsualizar Perfil Público".
