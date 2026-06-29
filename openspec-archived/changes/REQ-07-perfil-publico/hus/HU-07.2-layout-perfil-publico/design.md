# Diseno tecnico — HU-07.2 — Layout del perfil público

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

No introduce tablas. Consume el DTO `PublicProvider` (HU-07.1).

## Contrato de API

No aplica (la vista consume HU-07.1). Esta HU no expone nuevos endpoints.

## Validaciones Zod

No aplica. La vista confía en el shape validado por HU-07.1.

## Componentes UI

### Paginas Astro

- `src/pages/p/[slug].astro` — punto de entrada SSR. Recibe `slug` por param, hace `fetch('/api/v1/providers/' + slug)` en SSR y pasa el DTO al layout. Si 404 → renderiza el estado de error `mockups/profile.html:166-169`.
- Helper `src/lib/utils/getOrigin.ts` para resolver el origin del SSR fetch (importante en local: `http://app:4321` en Docker, `http://localhost:4321` en dev).

### Componentes Astro

- `src/components/providers/PublicProfile.astro` — orquestador; recibe prop `provider: PublicProvider`. Compone las 3 sub-secciones en grid `md:grid-cols-3`. Mockup base: `mockups/profile.html:56-161`.
- `src/components/providers/Header.astro` — sidebar con avatar, badge "Verificado" condicional (`mockups/profile.html:62-67`), nombre, oficio, comuna, rating (`mockups/profile.html:84-89`) y botones de contacto. Recibe `provider` y `providerId`.
- `src/components/providers/ContactButtons.astro` — renderiza los 3 botones (`mockups/profile.html:93-98`):
  - WhatsApp: `<a href="https://wa.me/56XXXXXXXXX" target="_blank" data-track-kind="whatsapp" data-provider-id="<id>">`.
  - Email: `<a href="mailto:..." target="_blank" data-track-kind="email" data-provider-id="<id>">`.
  - El botón de llamar se omite en esta HU (queda para HU futura cuando expongamos `phone_masked`).
- `src/components/providers/Description.astro` — bloque "Sobre mí" (`mockups/profile.html:118-125`). Si `description` es null → oculta la sección.
- Islas requeridas: no (todo server-side). El tracking se inyecta con un `<script>` inline que delega a `sendBeacon` (HU-08.3).

### Responsive

- Mobile-first: single-column (`grid-cols-1`).
- `md:` (768px+) → `md:grid-cols-3` con sidebar 1 col + contenido 2 cols (mockup `profile.html:56`).
- Imágenes con `max-w-full h-auto object-cover`; avatar redondo `w-24 h-24 rounded-full` (`mockups/profile.html:62`).

## Flujo de interaccion (secuencial)

1. Visitante llega a `/p/<slug>`.
2. SSR Astro: `const res = await fetch(origin + '/api/v1/providers/' + slug)`.
3. Si 404 → renderiza `ProfileError.astro` (`mockups/profile.html:166-169`).
4. Si 200 → pasa DTO a `<PublicProfile provider={...}>`.
5. `PublicProfile` compone `<Header>`, `<Description>`, `<ServicesSection>` (HU-07.3) y `<ReviewsSection>` (HU-07.4).
6. El `<script>` inline al final del layout engancha listeners `click` en `[data-track-kind]` y dispara `navigator.sendBeacon('/api/v1/contacts/track', ...)` antes de la navegación.

## Capa de servicios

No añade servicios nuevos. Reutiliza `getPublicProviderByIdOrSlug` (HU-07.1).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/components/contact-buttons.test.ts` | Renderiza 3 botones con `data-track-*` y `data-provider-id` correctos; URL `wa.me/` y `mailto:` correctas |
| Integración | `tests/integration/providers/profile-ssr.test.ts` | SSR contra D1 seed: HTML contiene oficio, comuna, descripción, badge verificado condicional, 3 botones de contacto |
| E2E | `tests/e2e/profile-render.spec.ts` | Carga `/p/juan-...` en viewport 360x640, valida `body.scrollWidth <= 360`, screenshot para regresión visual, verifica presencia de los 3 botones |

## Dependencias y secuencia

- **Bloqueado por:** HU-07.1 (endpoint).
- **Bloquea a:** HU-07.3 (servicios), HU-07.4 (reseñas), HU-07.5 (redirect `?id=`), HU-07.6 (SEO meta).
- **Recursos compartidos:** `Astro.locals.runtime.env.DB` (vía endpoint), helpers de tracking.

## Riesgos tecnicos

- Riesgo: SSR fetch hace loop infinito en algunos adapters → Mitigación: usar `fetch` nativo con `Astro.url.origin`; nunca `Astro.request.url` para construir el origin.
- Riesgo: la imagen R2 falla y rompe el SSR → Mitigación: `Header.astro` usa `<img>` con `onerror` que cae al placeholder; SSR no falla por imágenes.
- Riesgo: el listener de tracking se monta dos veces si la página tiene dos `ContactButtons` → Mitigación: el script usa `document.querySelectorAll` una sola vez y aplica `addEventListener` idempotente.
- Riesgo: el `target="_blank"` rompe tracking porque el navegador bloquea popup → Mitigación: `rel="noopener noreferrer"` y `sendBeacon` antes del `click` (no después de la navegación).
