# HU-28.3 — Sección Vecinos Guardados en dashboard-user

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-28-actividad-vecino-favoritos
**Rama:** `feat/HU-28.3-vista-favoritos-dashboard`

## Tareas técnicas

- [ ] **T1** Validador `listFavoritesQuerySchema` en `src/lib/validators/favorites.ts` (limit 1-50).
- [ ] **T2** Helper `mapTradeToBadgeClass(trade)` en `src/lib/services/activity/favorites.ts` — pure: devuelve clase Tailwind por oficio (`bg-blue-100 text-blue-700` Gasfiter, etc.) con fallback `bg-gray-100 text-gray-700`.
- [ ] **T3** Servicio `src/lib/services/activity/favorites-view.ts` con `buildFavoriteItem(row)` que compone `{provider_id, slug, name, initial, avatar_url, trade, trade_badge_class, phone_wa, favorited_at}`.
- [ ] **T4] Endpoint `src/pages/api/v1/users/me/favorites.ts` (GET, sesión vecino) → `{favorites: FavoriteItem[]}` ordenados por `favorited_at DESC`, excluyendo soft-deleted.
- [ ] **T5** Componentes:
  - `src/components/activity/FavoritesList.astro` con prop `{items}`. Mockup `mockups/dashboard-user.html:71-97`. Contenedor `bg-white rounded-3xl shadow-sm border border-gray-100 p-6`, header `ri-heart-line text-red-500`, lista `space-y-3`.
  - `src/components/activity/FavoriteRow.astro` con prop `{item}`. Mockup `mockups/dashboard-user.html:75-84`. Botón WhatsApp verde con tracking REQ-08 (`event: contact_whatsapp_from_favorites`).
  - `src/components/activity/FavoritesEmpty.astro` — empty state con texto "Aún no has guardado vecinos" + CTA `<a href="/">Buscar</a>`. Estilo botón de `mockups/dashboard-user.html:62`.
- [ ] **T6] Integrar `<FavoritesList items={favorites} />` en `src/pages/dashboard-user.astro` reemplazando items hardcoded de `mockups/dashboard-user.html:71-97`. SSR con datos de `listFavorites`.
- [ ] **T7** Isla JS mínima para "Quitar" en `FavoriteRow` (avatar → menú) que llama `DELETE /api/v1/users/me/favorites/:provider_id` y elimina el `<li>`. Si lista queda vacía → renderiza `<FavoritesEmpty />` in-place.
- [ ] **T8** Truncar nombre con `class="truncate max-w-[12rem]"` y `title={name}` para evitar romper flex.
- [ ] **T9** Tests:
  - [ ] `tests/unit/favorites/map-trade-badge.test.ts` — mapping oficio → clase Tailwind con fallback.
  - [ ] `tests/unit/favorites/build-favorite-item.test.ts` — avatar con/sin foto, derivación de inicial.
  - [ ] `tests/integration/favorites/get-list.test.ts` — GET endpoint: orden, exclusión soft-deleted, 401.
  - [ ] `tests/e2e/favorites-dashboard.spec.ts` — vecino marca en `/`, va a `/dashboard-user`, ve el card, hace clic WhatsApp y tracking registra.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `mapTradeToBadgeClass`, no manejar oficio desconocido → retorna clase vacía, test unitario rojo → restaurar
- [ ] Sabotaje 2: olvidar el filtro `deleted_at IS NULL` en `listFavorites` → favoritos soft-deleted aparecen, test integración rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/activity/favorites-view.ts`
- [ ] Type check verde
- [ ] Commit `feat: vista favoritos en dashboard` y push