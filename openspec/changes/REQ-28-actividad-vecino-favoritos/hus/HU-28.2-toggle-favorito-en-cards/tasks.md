# HU-28.2 — Botón corazón en cards de index y profile

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-28-actividad-vecino-favoritos
**Rama:** `feat/HU-28.2-toggle-favorito-en-cards`

## Tareas técnicas

- [ ] **T1** Validador `providerIdParamSchema` en `src/lib/validators/favorites.ts` (uuid).
- [ ] **T2] Endpoint `src/pages/api/v1/users/me/favorites/[provider_id].ts`:
  - POST (sesión vecino) → llama `addFavorite`. 404 si provider inexistente, 410 si soft-deleted. Idempotente.
  - DELETE (sesión vecino) → llama `removeFavorite`. Idempotente.
- [ ] **T3** Componente `src/components/favorites/FavoriteButton.astro` con props `{providerId, initialActive, size?: 'sm'|'md'}`. Mockup `mockups/dashboard-user.html:72` (icono heart) + `mockups/dashboard-user.html:83` (estilo circular con color red). Isla `client:load` con optimistic update.
- [ ] **T4** Cliente `src/lib/client/favorites.ts` con `toggleFavorite(providerId, current)` que selecciona POST/DELETE según estado, lanza error si no 2xx.
- [ ] **T5] Render batch: extender endpoint que renderiza `/` (REQ-06) para hacer `SELECT provider_id FROM user_favorites WHERE user_id = ? AND provider_id IN (?, ?, ...)` y pasar `initialActive` por card (evitar N+1).
- [ ] **T6** Integrar `<FavoriteButton>` en `src/pages/index.astro` (cards grid + list). Mockup `mockups/index.html:317-375` y `mockups/index.html:377+`. Posición `absolute top-3 right-3` (líneas 320-342).
- [ ] **T7** Integrar `<FavoriteButton>` en `src/pages/p/[slug].astro` (header del perfil junto a "Contactar"). Mockup `mockups/profile.html:60-104` (líneas 92-103).
- [ ] **T8] Isla maneja estados:
  - `pending` → ignora clics adicionales hasta terminar request.
  - 401 → abre modal login (REQ-01) y revierte icono.
  - 4xx/5xx → revierte y muestra toast.
- [ ] **T9** Tests:
  - [ ] `tests/unit/favorites/toggle-client.test.ts` — selección de método según estado, manejo de errores.
  - [ ] `tests/integration/favorites/toggle.test.ts` — POST/DELETE contra D1, idempotencia, 401 sin sesión, 404 provider inexistente, 410 soft-deleted.
  - [ ] `tests/e2e/favorite-toggle.spec.ts` — vecino logueado en `/` clica corazón, recarga, sigue activo.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `toggleFavorite`, invertir POST/DELETE → activo se desactiva al click y viceversa, test E2E rojo → restaurar
- [ ] Sabotaje 2: olvidar el guard `pending` en la isla → doble POST crea doble fila, test integración rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/favorites.ts`, `src/lib/services/activity/favorites.ts`
- [ ] Type check verde
- [ ] Commit `feat: toggle favoritos en cards` y push