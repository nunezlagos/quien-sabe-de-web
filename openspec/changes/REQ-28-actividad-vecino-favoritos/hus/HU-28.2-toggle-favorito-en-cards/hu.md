# HU-28.2 — Botón corazón en cards de index y profile

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Historia de usuario

**Como** vecino
**Quiero** marcar prestadores como favoritos con un clic
**Para** encontrarlos rápido luego

## Criterios de aceptación (Gherkin)

### Escenario: Toggle con corazón
  Dado un vecino logueado mirando `/` (index)
  Cuando hace clic en el corazón de una card
  Entonces el cliente envía `POST /api/v1/users/me/favorites/<provider_id>`
  Y el icono cambia a `ri-heart-fill text-red-500` (estilo reusado de `mockups/dashboard-user.html:72`)

### Escenario: Toggle off
  Dado un favorito existente
  Cuando hace clic de nuevo
  Entonces se envía `DELETE` y el icono vuelve a `ri-heart-line`

### Escenario: No logueado → modal login
  Cuando un visitante sin sesión hace clic en el corazón
  Entonces se abre el modal de login (REQ-01)

### Escenario: Profile.html header también
  Cuando reviso `mockups/profile.html` header del perfil
  Entonces se agrega el corazón junto al botón de contacto WhatsApp (mockup pendiente; reusar estilo `w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition` análogo al botón WhatsApp `mockups/dashboard-user.html:83`; color canónico es green (matching WhatsApp button bg-green-100 text-green-600 hover:bg-green-500 hover:text-white) en `mockups/dashboard-user.html:103`/`114`)

### Escenario: Idempotente
  Cuando POST se llama dos veces para mismo par
  Entonces recibo 200 (la segunda) sin duplicar

## Tareas técnicas

- [ ] Endpoints `src/pages/api/v1/users/me/favorites/[provider_id].ts` (POST, DELETE)
- [ ] Componente `<FavoriteButton providerId />` en `src/components/favorites/FavoriteButton.astro`
- [ ] Cliente JS `src/lib/client/favorites.ts` con optimistic update
- [ ] Insertar botón en cards de `src/pages/index.astro` y header de `src/pages/p/[slug].astro`
- [ ] Tests `tests/integration/favorites/toggle.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
