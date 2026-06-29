# HU-08.3 — Botones de contacto wireados con sendBeacon

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-08-contacto-tracking
**Rama:** `feat/HU-08.3-client-sendbeacon`

## Tareas técnicas

- [ ] **T1** Cliente `src/lib/client/track-contact.ts` con:
  - `trackContact(payload): boolean` — wrapper de `navigator.sendBeacon` con feature-detect (`if (typeof navigator !== 'undefined' && navigator.sendBeacon)`). Si no existe → `fetch(..., { keepalive: true })`. Si tampoco → `console.warn`.
  - `installContactTrackingListeners(root?: ParentNode): void` — delegación sobre `[data-track-kind]` en captura (no fase burbuja para no chocar con handlers del DOM).
  - Guard `if (typeof window !== 'undefined')` para evitar ejecución en SSR/build.
- [ ] **T2** Componente `src/components/providers/ContactButtons.astro` con props `{providerId, whatsapp?, email?, phone?, variant: 'profile' | 'card-grid' | 'card-list'}`. Emite:
  - `<a data-track-kind="whatsapp" data-provider-id="42" data-href="https://wa.me/56912345678" href="...">` para WhatsApp.
  - Igual para `phone` (`tel:+569...`) y `email` (`mailto:...`).
  - Estilos por `variant` derivados de `mockups/profile.html:92-103`, `mockups/index.html:369-371`, `mockups/index.html:416-422`.
- [ ] **T3** Cargar `installContactTrackingListeners()` desde un script global del layout (`src/layouts/BaseLayout.astro` o equivalente). Inicializar en `DOMContentLoaded`.
- [ ] **T4** Integrar `ContactButtons` en `src/pages/p/[slug].astro` (REQ-07) — variant `profile`. Por ahora, si la página aún no existe, crear stub que renderice con datos mockeados para poder probar E2E.
- [ ] **T5** Tests:
  - [ ] `tests/unit/client/track-contact.test.ts` — mock `navigator.sendBeacon`, validar payload JSON correcto; fallback a fetch cuando sendBeacon ausente; feature-detect emite warn.
  - [ ] `tests/unit/client/track-contact.dom.test.ts` (jsdom) — listeners instalados leen `data-*` y llaman `trackContact`; click NO hace preventDefault.
  - [ ] `tests/e2e/contact-tracking.spec.ts` (Playwright) — clic en `#profile-whatsapp-btn` dispara POST a `/api/v1/contacts/track` con body correcto Y abre `wa.me/...`; clic email → POST + `mailto:`; con endpoint caído (mock 500) el redirect ocurre igual.
- [ ] **T6** Verificar accesibilidad: el `<a>` sigue siendo un ancla real (tab-navegable, screen-reader friendly), el script es una mejora.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/contact-tracking.spec.ts` → verde (corre contra stack dev con `make up`)
- [ ] Sabotaje confirmado: romper `data-provider-id` en el template → test E2E rojo (POST con `provider_id` undefined o NaN) → restaurar
- [ ] Sabotaje 2: hacer que el listener llame `preventDefault()` → redirect NO ocurre, test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/track-contact.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: contact buttons con sendBeacon tracking` y push a rama