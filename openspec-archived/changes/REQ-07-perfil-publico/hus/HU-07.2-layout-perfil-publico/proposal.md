# Propuesta — HU-07.2 — Layout del perfil público

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

El layout es el contenedor visual del perfil público. Debe renderizar server-side (SSR) con la foto, oficio, comuna, descripción y botones de contacto sin spinner inicial, para garantizar SEO y rendimiento en first paint. Los botones de contacto (WhatsApp, llamar, email) necesitan atributos `data-track-kind` y `data-provider-id` para alimentar el tracking de REQ-08. La vista debe responder a `/p/:slug` (slug humano) y `/profile?id=` (compatibilidad, redirect a cargo de HU-07.5). Vínculo con OE2 (perfil = punto de conversión).

## Mockups de referencia

- `mockups/profile.html:45-114` — sidebar con avatar, oficio, comuna, rating, "Disponible ahora", botones WhatsApp/Email, botón "Reportar".
- `mockups/profile.html:118-125` — bloque "Sobre mí" (descripción).
- `mockups/profile.html:31-42` — navbar superior (referencia de navegación, no se replica acá).
- `mockups/profile.html:62-67` — badge "Verificado" condicional.

## Alternativas consideradas

### Opcion A — SSR Astro con sub-componentes `Header`, `ContactButtons`, `Description`
- Vista `src/pages/p/[slug].astro` que hace fetch a `/api/v1/providers/[idOrSlug]` (HU-07.1) en SSR y renderiza sub-componentes.
- Pro: separación de responsabilidades; cada bloque se testea de forma aislada.
- Pro: la sub-componente `ContactButtons` es el lugar natural para añadir `data-track-*` y para inyectar el script de tracking (REQ-08).
- Contra: requiere disciplina para no fetchear el endpoint dos veces (SSR + cliente).

### Opcion B — Hidratación cliente con fetch + skeleton
- HTML mínimo + isla que hace fetch a la API y rellena.
- Pro: menor SSR compute.
- Contra: spinner inicial viola criterio de aceptación (SSR completo, sin spinner).
- Contra: peor SEO y peor first-contentful-paint en mobile.

### Opcion C — Renderizar directo desde Drizzle sin pasar por el endpoint
- Vista Astro consulta Drizzle directo, sin fetch intermedio.
- Pro: ahorra un round-trip.
- Contra: duplica la lógica del endpoint (HU-07.1) en el componente.
- Contra: cualquier cambio de contrato del DTO debe mantenerse en dos lugares.

## Decision

Se elige **Opcion A**. SSR con sub-componentes es la única opción que cumple el criterio de aceptación (sin spinner) y mantiene una única fuente de verdad (el endpoint de HU-07.1). El sub-componente `ContactButtons` se construye para ser el único responsable de inyectar los atributos de tracking, de modo que REQ-08 sólo tenga que cambiar un archivo.

## Riesgos y mitigaciones

- Riesgo: doble fetch (SSR + cliente) → Mitigación: la vista SSR pasa el DTO a la isla como prop; la isla no re-fetchea.
- Riesgo: el atributo `data-track-*` rompe el `target="_blank"` de WhatsApp → Mitigación: el handler `sendBeacon` (HU-08.3) usa `navigator.sendBeacon` y respeta la navegación; el `target` se mantiene.
- Riesgo: overflow horizontal en mobile 360x640 → Mitigación: tests E2E Playwright con `viewport: { width: 360, height: 640 }`; clases `flex-col md:flex-row` y `max-w-full` en imágenes.
- Riesgo: SSR falla porque el endpoint no responde → Mitigación: la vista no envuelve el fetch en try/catch silencioso; cualquier 5xx propaga como error 500 de la página.

## Metrica de exito

- `curl /p/juan-gasfiter-las-condes` → HTML 200 contiene foto, oficio, comuna y descripción en el primer byte útil.
- `curl /p/juan-gasfiter-las-condes | grep data-provider-id` → 3 ocurrencias (uno por botón de contacto).
- Playwright a viewport 360x640 → `page.evaluate(() => document.body.scrollWidth) <= 360`.
- Playwright sin JS habilitado → contenido completo visible (degradación progresiva OK).
