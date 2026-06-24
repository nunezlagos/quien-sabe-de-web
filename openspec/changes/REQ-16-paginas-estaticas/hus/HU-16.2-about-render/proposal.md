# Propuesta — HU-16.2 — Renderizar /about

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

`/about` es la página que explica la misión, el modelo comunitario y la
solicitud de donaciones. Hoy el repositorio tiene `src/pages/about.astro`
vacío (0 líneas) y el copy vive en `mockups/about.html` como referencia de UI.
Necesitamos que la página se renderice desde la content collection `legal`
(HU-16.1) en build (SSG), con el mismo layout y patrones visuales de las
demás páginas del proyecto. Esto desbloquea el link "Donaciones" del footer
que ya está presente en `mockups/terms.html:91`, `mockups/privacy.html:176` y
`mockups/index.html`.

## Mockups de referencia

- `mockups/about.html` — layout final esperado (hero gris con texto blanco,
  cards de opciones, secciones de transparencia y misión). Línea 41-130 es la
  estructura reusable.

## Alternativas consideradas

### Opcion A — SSG desde `getEntry("legal","about")` en build
- `src/pages/about.astro` ejecuta `await getEntry("legal","about")` en frontmatter y renderiza `<Content />`.
- Pro: HTML estático servible desde CDN edge; SEO óptimo; 0 ms TTFB.
- Pro: cualquier cambio requiere redeploy pero el contenido se mantiene en repo (versionado, auditable).
- Contra: requiere rebuild para cada edición de copy.

### Opcion B — SSR on-demand con revalidación
- `export const prerender = false` + `getEntry` en cada request; cache KV/edge con TTL 5 min.
- Pro: edición de copy sin redeploy.
- Contra: invalida cache, complica el pipeline, no aporta valor real (las páginas legales cambian 1-2 veces al año).

### Opcion C — Markdown servido como raw de R2
- Subir `.md` a R2, página hace fetch y parsea con `marked` en runtime.
- Pro: edición por no-devs vía dashboard.
- Contra: requiere construir un uploader; pierde la garantía de validación Zod del build; fuera de scope de esta HU.

## Decision

Se elige **Opcion A**. SSG es coherente con la baja frecuencia de cambios de
estas páginas y con el resto del proyecto. El path `/about` debe devolver
`200` y el `<h1>` debe coincidir con el frontmatter `title` (verificable vía
test E2E).

## Riesgos y mitigaciones

- Riesgo: build falla si el archivo `about.md` no tiene `title` → Mitigación: el schema Zod de HU-16.1 ya lo exige.
- Riesgo: pie "Última actualización" muestra fecha incorrecta si el frontmatter se desactualiza → Mitigación: convention PR template pide actualizar `updated_at` en cada cambio de copy.
- Riesgo: copy demasiado largo infla el bundle → Mitigación: el límite de 280 chars en `description` y la guía editorial limitan el tamaño; el bundle sigue siendo estático.

## Metrica de exito

- `GET /about` retorna 200 y el HTML incluye el `<h1>` con el title del frontmatter.
- El footer muestra "Última actualización: <fecha>" en formato `DD MMM YYYY`.
- Test E2E Playwright `tests/e2e/about-page.spec.ts` verifica heading, fecha y link "Volver al Inicio".
