# HU-07.6 — Metadatos SEO en perfiles públicos

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.6-metadatos-seo`

## Tareas técnicas

- [ ] **T1** Crear `public/og-default.png` (1200x630 px). Commitear al repo como asset estático.
- [ ] **T2** Helpers en `src/lib/utils/seo.ts`:
  - `truncate(s: string | null, max: number): string` — `null → ''`; `>max → slice(0, max-3) + '...'`.
  - `buildOgMeta(provider: PublicProvider): { title: string, description: string, image: string }`.
  - `buildJsonLd(provider: PublicProvider, origin: string): string` — JSON stringificado; omitir `aggregateRating` si `ratingAvg === null`; omitir `image` si null.
- [ ] **T3** Validador `seoDescriptionSchema` y `jsonLdSchema` en `src/lib/validators/seo.ts`.
- [ ] **T4** Componente `src/components/providers/SeoMeta.astro`:
  - Props: `provider: PublicProvider`, `origin: string`.
  - Render en `<head>`:
    - `<title>`.
    - `<meta name="description">` con `truncate(provider.description, 160)`.
    - `<meta property="og:type" content="profile">`.
    - `<meta property="og:title">` con "Juan — Gasfíter en Las Condes".
    - `<meta property="og:description">` con `truncate(provider.description, 160)`.
    - `<meta property="og:image">` con `provider.photoUrl ?? '/og-default.png'`.
    - `<meta property="og:url">` con `${origin}/p/${provider.slug}`.
    - `<script type="application/ld+json" set:html={buildJsonLd(provider, origin)} />`.
- [ ] **T5** Integrar `<SeoMeta provider={provider.data} origin={getOrigin(Astro)} />` en el `<head>` de `src/pages/p/[slug].astro`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/seo.test.ts` — `truncate(null) === ''`, `truncate('hola mundo', 5) === 'ho...'`, `truncate('hola', 10) === 'hola'`; `buildOgMeta` retorna title/description/image correctos; `buildJsonLd` retorna string que parsea con `@type: "LocalBusiness"` y `address.addressCountry: "CL"`.
  - [ ] `tests/unit/validators/seo.test.ts` — `seoDescriptionSchema` rechaza 161 chars, acepta 160; `jsonLdSchema` acepta shape mínimo, rechaza sin `@context`.
  - [ ] `tests/unit/components/seo-meta.test.ts` — render con provider completo: assert 1 ocurrencia de cada `og:*` (no duplicados); assert `<script type="application/ld+json">` parseable.
  - [ ] `tests/unit/components/seo-meta.test.ts` — provider sin foto: `og:image === '/og-default.png'`; provider sin reseñas: JSON-LD no incluye `aggregateRating`.
  - [ ] `tests/integration/providers/seo-meta.test.ts` — seed 2 providers (con y sin foto); GET `/p/<slug>`; assert HTML contiene meta esperados y JSON-LD parseable; assert `description` truncado a 160 chars máx.
  - [ ] `tests/e2e/profile-seo.spec.ts` — Playwright carga perfil; `await page.$$eval('meta[property^="og:"]', els => els.length) <= 5`; `JSON.parse(await page.$eval('script[type="application/ld+json"]', el => el.textContent))`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: quitar `truncate(provider.description, 160)` y usar `provider.description` directo → test "description ≤ 160 chars" cae → restaurar
- [ ] Sabotaje 2: hardcodear `aggregateRating: { ratingValue: 5.0, reviewCount: 999 }` en `buildJsonLd` → test "JSON-LD sin aggregateRating cuando no hay reseñas" cae → restaurar
- [ ] Sabotaje 3: cambiar el `og:image` fallback a una string vacía → test "sin foto → /og-default.png" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/seo.ts` y `src/components/providers/SeoMeta.astro`
- [ ] Type check verde
- [ ] Commit `feat: metadatos SEO y JSON-LD en perfiles públicos` y push
