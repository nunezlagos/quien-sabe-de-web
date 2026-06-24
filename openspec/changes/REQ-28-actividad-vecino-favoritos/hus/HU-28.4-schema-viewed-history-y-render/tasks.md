# HU-28.4 — Schema user_views + sección Recientes

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-28-actividad-vecino-favoritos
**Rama:** `feat/HU-28.4-schema-viewed-history-y-render`

## Tareas técnicas

- [ ] **T1** Agregar tabla `user_views` a `src/database/schema.ts`: `id` UUID PK autogenerado, FK `user_id`, FK `provider_id`, `view_type` enum `('profile'|'search')`, `viewed_at` unixepoch. Índice `idx_user_views_user_viewed(user_id, viewed_at DESC)`.
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_user_views.sql` con tabla, PK autogenerada, CHECK enum view_type, índice y FKs.
- [ ] **T3** Aplicar migración local.
- [ ] **T4** Servicio `src/lib/services/activity/views.ts` con `recordView(env, userId, providerId, type?)` (dedupe vía KV `view_dedupe:<userId>:<providerId>` TTL 3600), `listViews(db, userId, limit?)` (join providers, filtra soft-deleted, orden viewed_at DESC, default 5), `trimUserViews(db, userId, keep=50)`, `trimAllUserViews(db, keep=50)`.
- [ ] **T5** Validadores `providerIdParamSchema` y `listViewsQuerySchema` en `src/lib/validators/views.ts`.
- [ ] **T6] Endpoints:
  - `src/pages/api/v1/providers/[id]/views.ts` (POST, sesión vecino). 401 sin sesión, 404 provider inexistente, 410 soft-deleted.
  - `src/pages/api/v1/users/me/views.ts` (GET, sesión vecino, query limit 1-50 default 5).
- [ ] **T7] En `src/pages/p/[slug].astro`: tras resolver provider, si hay sesión vecino y `session.user_id !== provider.user_id`, ejecutar `recordView` con `Astro.locals.runtime.ctx.waitUntil(...)` para no bloquear el render.
- [ ] **T8] Componentes:
  - `src/components/activity/RecentViews.astro` con prop `{items}`. Mockup `mockups/dashboard-user.html:100-112`. Contenedor `bg-white rounded-3xl shadow-sm border border-gray-100 p-6`, header `ri-history-line text-gray-400`, `<ul class="space-y-3">`. Sin isla (SSR puro). Cada `<li>` envuelve `<a href={slug}>`.
  - `src/components/activity/RecentViewsEmpty.astro` — empty state "Sin actividad reciente".
- [ ] **T9] Integrar `<RecentViews items={views} />` en `src/pages/dashboard-user.astro` reemplazando mockup `mockups/dashboard-user.html:100-112`. SSR con datos de `listViews`.
- [ ] **T10] Cron mensual (`0 3 1 * *` en `wrangler.toml`) que llama `trimAllUserViews(env, 50)` para evitar crecimiento ilimitado.
- [ ] **T11] Tests:
  - [ ] `tests/unit/views/dedupe.test.ts` — dedupe vía KV mock < 1h.
  - [ ] `tests/unit/views/trim.test.ts` — `trimUserViews` mantiene top 50.
  - [ ] `tests/integration/views/record-and-list.test.ts` — POST + GET contra D1 + KV reales.
  - [ ] `tests/integration/views/self-view-skip.test.ts` — provider visitando su propio perfil no registra.
  - [ ] `tests/e2e/recent-views.spec.ts` — vecino visita perfil → aparece en dashboard.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `recordView`, olvidar el check KV dedupe → 100 vistas al mismo perfil insertan 100 filas, test integración rojo → restaurar
- [ ] Sabotaje 2: en `recordView`, no usar `ctx.waitUntil` → latencia del render aumenta, test E2E de performance rojo → restaurar
- [ ] Sabotaje 3: en `listViews`, no filtrar `deleted_at IS NULL` → soft-deleted aparece en recientes, test integración rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/activity/views.ts`
- [ ] Type check verde
- [ ] Commit `feat: schema user_views + sección recientes` y push