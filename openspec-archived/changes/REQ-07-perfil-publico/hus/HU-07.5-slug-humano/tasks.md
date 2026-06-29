# HU-07.5 — Slug humano y redirect desde ?id=

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.5-slug-humano`

## Tareas técnicas

- [ ] **T1** Extender `src/lib/utils/slug.ts` con `generateSlug(name: string, trade: string, commune: string): string`:
  - `slugify(name)` + `-` + `slugify(trade)` + `-` + `slugify(commune)`.
  - Si una parte queda vacía tras `slugify` → lanza `InvalidSlugInputError`.
- [ ] **T2** Servicio `generateUniqueSlug(env, name, trade, commune): Promise<string>` en `src/lib/services/providers.ts`:
  - Constante `MAX_ATTEMPTS = 10`.
  - Loop: `candidate = generateSlug(...)`. Si ya tiene sufijo numérico → `candidate.replace(/-\d+$/, '')` primero.
  - Query `SELECT 1 FROM providers WHERE slug = ? LIMIT 1`. Si libre → return.
  - Si ocupado y `attempt === 0` → `candidate = candidate + '-2'`. Else `candidate = base + '-' + (attempt + 2)`.
  - Si `MAX_ATTEMPTS` se agota → lanza `MaxAttemptsError`.
- [ ] **T3** Validador `generateSlugInputSchema` y `slugSchema` en `src/lib/validators/providers.ts`.
- [ ] **T4** Migración `src/database/migrations/00XX_providers_slug.sql`:
  - `ALTER TABLE providers ADD COLUMN slug TEXT;`
  - (Backfill se hace vía script TS antes de crear el índice; la migración sólo crea el índice UNIQUE).
  - `CREATE UNIQUE INDEX idx_providers_slug ON providers(slug);`
- [ ] **T5** Script `scripts/backfill-provider-slugs.ts`:
  - Lee `db.select().from(providers).where(isNull(providers.slug))`.
  - Para cada uno: `const slug = await generateUniqueSlug(env, p.name, p.trade, p.commune)`.
  - `UPDATE providers SET slug = ? WHERE id = ?`.
  - Loggear cuántos procesó.
- [ ] **T6** Vista `src/pages/profile.astro`:
  - `Astro.url.searchParams.get('id')` → si null o no-numérico → 404.
  - `const provider = await getPublicProviderByIdOrSlug(env, id)`.
  - Si `null` o `!provider.slug` → 404.
  - `return new Response(null, { status: 301, headers: { Location: '/p/' + provider.slug, 'Cache-Control': 'public, max-age=86400' } });`
- [ ] **T7** Tests:
  - [ ] `tests/unit/utils/slug.test.ts` — `generateSlug("Juan Pérez", "Gasfiter", "Las Condes") === "juan-perez-gasfiter-las-condes"`; con tildes `"María"` → `"maria"`; comuna vacía → lanza.
  - [ ] `tests/unit/services/providers.test.ts` — `generateUniqueSlug` con provider libre retorna base; con colisión retorna `-2`; con 11 colisiones lanza `MaxAttemptsError`.
  - [ ] `tests/unit/validators/providers.test.ts` — `slugSchema` acepta `juan-perez`, rechaza `Juan-Pérez`, rechaza `juan--perez`, rechaza `-juan`, acepta `123-abc`.
  - [ ] `tests/integration/providers/slug-redirect.test.ts` — seed provider con `slug="test-slug"`; `GET /profile?id=<id>` → 301 `Location: /p/test-slug`; `GET /profile?id=99999` → 404; `Cache-Control` presente.
  - [ ] `tests/integration/providers/slug-backfill.test.ts` — seed 3 providers sin slug con datos colisionables; ejecutar script en memoria; assertear 3 slugs distintos y UNIQUE.
  - [ ] `tests/e2e/profile-redirect.spec.ts` — Playwright `goto('/profile?id=1')` → URL final `/p/<slug>` (sigue redirect).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: comentar la creación del índice UNIQUE en la migración → aplicar migración dos veces con mismo provider → la 2ª pasa sin error (no debería) → restaurar
- [ ] Sabotaje 2: en `generateUniqueSlug`, no probar el sufijo `-2` y quedarse en el base siempre → test "colisión retorna -2" cae → restaurar
- [ ] Sabotaje 3: cambiar el `301` por `302` en `profile.astro` → test E2E Playwright verifica código 301 y falla → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/providers.ts` (ramas nuevas) y `src/lib/utils/slug.ts`
- [ ] Type check verde
- [ ] Commit `feat: slug humano + redirect /profile?id= a /p/:slug` y push
