# HU-07.1 — Endpoint GET de perfil público

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.1-endpoint-perfil-publico`

## Tareas técnicas

- [ ] **T1** Definir DTO `PublicProvider` y `PublicService` en `src/lib/dto/providers.ts` con tipos exactos y `export type` (no `interface`) para serialización JSON.
- [ ] **T2** Helper `maskContact(value: string | null): string | null` en `src/lib/services/providers.ts` — para phone/whatsapp formato `+56 9 **** 1234`, para email `j***@e***.cl`. Si no matchea patrón conocido → `null`.
- [ ] **T3** Servicio `getPublicProviderByIdOrSlug(env, idOrSlug)` en `src/lib/services/providers.ts`:
  - Si `idOrSlug` matchea `/^\d+$/` → `db.select().from(providers).where(eq(providers.id, Number(idOrSlug)))`.
  - Else → `where(eq(providers.slug, idOrSlug))`.
  - Filtra `status != 'deleted'` con `and(...)`.
  - En paralelo: `getProviderRatingStats(env, id)` y `listActiveServices(env, id)`.
  - Retorna `PublicProvider` o `null`.
- [ ] **T4** Stub `getProviderRatingStats(env, providerId)` en `src/lib/services/reviews.ts` — retorna `{ avg: null, count: 0 }` si la tabla `reviews` aún no existe; HU-09.1 lo extiende. Acepta `reviews` opcional.
- [ ] **T5** Validador `publicProviderDTOSchema` y `idOrSlugParamSchema` en `src/lib/validators/providers.ts`.
- [ ] **T6** Endpoint `src/pages/api/v1/providers/[idOrSlug].ts` (GET):
  - `Astro.params.idOrSlug` → validar con `idOrSlugParamSchema` (400 si falla).
  - `const provider = await getPublicProviderByIdOrSlug(Astro.locals.runtime.env, idOrSlug)`.
  - Si `null` → `errorResponse('provider not found', 404)`.
  - Else → `successResponse(provider, 200)`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/services/providers.test.ts` — `maskContact` cubre phone, whatsapp, email, null, inválido.
  - [ ] `tests/unit/services/providers.test.ts` — `getPublicProviderByIdOrSlug` con stub in-memory devuelve `PublicProvider` correcto.
  - [ ] `tests/unit/validators/providers.test.ts` — DTO schema acepta forma válida; rechaza `ratingAvg: 6`; rechaza `reviewsCount: -1`.
  - [ ] `tests/integration/providers/public-get.test.ts` — 200 con DTO completo (id, slug, trade, commune, description, photoUrl, verified, ratingAvg, reviewsCount, services, contact); 404 por id inexistente; 404 por slug de soft-deleted; sin sesión responde 200; response no contiene `phone`/`whatsapp`/`email` en claro.
  - [ ] `tests/e2e/profile-render.spec.ts` (base; completo en HU-07.2) — GET al endpoint devuelve JSON parseable.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: comentar la rama `status != 'deleted'` en el servicio → test "soft-deleted → 404" cae → restaurar
- [ ] Sabotaje 2: en `maskContact`, devolver `value` sin modificar → test "no contiene phone en claro" cae (grep del response por número crudo) → restaurar
- [ ] Sabotaje 3: invertir la rama `^\d+$` (usar slug siempre) → test "GET por id numérico" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/providers.ts` y `src/lib/validators/providers.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: endpoint público de perfil con DTO enmascarado` y push a rama (no merge a main)
