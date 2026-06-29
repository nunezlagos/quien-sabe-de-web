# HU-07.2 — Layout del perfil público

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.2-layout-perfil-publico`

## Tareas técnicas

- [ ] **T1** Helper `src/lib/utils/getOrigin.ts` exportando `getOrigin(Astro): string` — usa `Astro.url.origin`; en CI sin origin definido, fallback a `http://localhost:4321`.
- [ ] **T2** Componente `src/components/providers/Header.astro`:
  - Avatar `w-24 h-24 rounded-full` con `onerror` → `/placeholder-avatar.png`.
  - Badge "Verificado" (`mockups/profile.html:65-67`) sólo si `provider.verified === true`.
  - Nombre, oficio (`bg-green-50 px-3 py-1.5 rounded-xl`), comuna con icono `ri-map-pin-line`.
  - Rating con `renderStars(ratingAvg)` (helper inline; 5 estrellitas SVG).
  - Contador `reviewsCount + " trabajos realizados"` (mockup `profile.html:88`).
- [ ] **T3** Componente `src/components/providers/ContactButtons.astro`:
  - Props: `providerId: number`, `whatsappMasked: string | null`, `emailMasked: string | null`.
  - Botón WhatsApp: `<a target="_blank" rel="noopener noreferrer" data-track-kind="whatsapp" data-provider-id={providerId}>` con icono `ri-whatsapp-line`.
  - Botón Email: `<a data-track-kind="email" ...>` con icono `ri-mail-line`.
  - Si `whatsappMasked === null` → oculta botón WhatsApp.
  - Si `emailMasked === null` → oculta botón Email.
- [ ] **T4** Componente `src/components/providers/Description.astro` — renderiza `<p>{provider.description}</p>` con clases `text-gray-600 text-sm leading-relaxed`. Si `description === null` → no renderiza la sección.
- [ ] **T5** Componente `src/components/providers/PublicProfile.astro` — orquestador con grid `grid-cols-1 md:grid-cols-3 gap-4`. Slots: `<Header>` en col 1, `<Description>` + `<ServicesSection>` + `<ReviewsSection>` en col 2.
- [ ] **T6** Componente `src/components/providers/ProfileError.astro` — replica `mockups/profile.html:166-169` ("Vecino no encontrado" + link al inicio).
- [ ] **T7** Vista `src/pages/p/[slug].astro`:
  - `Astro.params.slug` → `fetch(getOrigin(Astro) + '/api/v1/providers/' + slug)`.
  - Si 404 → renderiza `<ProfileError />`.
  - Si 200 → `const provider = await res.json()` (de `successResponse` envelope).
  - Renderiza `<PublicProfile provider={provider.data} />`.
- [ ] **T8** Script inline en `PublicProfile.astro` que engancha `click` a `[data-track-kind]` y dispara `navigator.sendBeacon('/api/v1/contacts/track', JSON.stringify({ provider_id, kind }))`. Si `sendBeacon` no existe → fallback `fetch(..., { keepalive: true })`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/components/contact-buttons.test.ts` — renderiza 3 botones esperados, atributos `data-track-*` presentes, URL `wa.me/` y `mailto:` correctas.
  - [ ] `tests/integration/providers/profile-ssr.test.ts` — seed prestador con foto+descripción+verified; GET `/p/<slug>`; HTML contiene oficio, comuna, descripción, badge "Verificado", 3 botones de contacto, atributo `data-provider-id="<id>"`.
  - [ ] `tests/integration/providers/profile-ssr.test.ts` — prestador sin descripción → sección Sobre mí no aparece en HTML.
  - [ ] `tests/e2e/profile-render.spec.ts` — Playwright viewport 360x640, `body.scrollWidth <= 360`, screenshot.
  - [ ] `tests/e2e/profile-tracking.spec.ts` — clic en WhatsApp dispara `sendBeacon` (mock) con payload correcto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: quitar el atributo `data-track-kind` de `ContactButtons.astro` → test "atributos `data-track-*` presentes" cae → restaurar
- [ ] Sabotaje 2: cambiar `grid-cols-1 md:grid-cols-3` por `grid-cols-3` siempre → test E2E viewport 360x640 (`scrollWidth <= 360`) cae → restaurar
- [ ] Sabotaje 3: comentar la rama 404 en `p/[slug].astro` → test "prestador inexistente → 404" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/components/providers/Header.astro`, `ContactButtons.astro`, `Description.astro`
- [ ] Type check verde
- [ ] Commit `feat: layout SSR del perfil público con tracking` y push
