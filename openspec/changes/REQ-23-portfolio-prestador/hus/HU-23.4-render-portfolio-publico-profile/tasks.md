# HU-23.4 — Render del portfolio público en profile.html

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-23-portfolio-prestador
**Rama:** `feat/HU-23.4-render-portfolio-publico-profile`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/portfolio/render.ts` con `getPortfolioUrls(db, env, providerId)` (ordenado por `sort_order ASC`) y `resolveR2PublicUrl(env, r2Key)` (CDN prod o `http://localhost:9002/<bucket>/<key>` dev).
- [ ] **T2** Validador `providerIdParamSchema` en `src/lib/validators/portfolio.ts` (coerce number positive).
- [ ] **T3] Endpoint opcional `src/pages/api/v1/providers/[id]/portfolio.ts` (GET, público). 404 si provider no existe, 410 si soft-deleted. Headers `Cache-Control: public, max-age=60, s-maxage=60`.
- [ ] **T4** Componente `src/components/portfolio/PortfolioGrid.astro` con props `{items: PortfolioItem[], editable: boolean}`. Mockup base `mockups/profile.html:179-189`. Sin botones delete cuando `editable=false`. Grid `grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 portfolio-grid`.
- [ ] **T5** Componente `src/components/portfolio/EmptyPortfolio.astro` con texto "Aún no hay trabajos cargados". Mockup `mockups/profile.html:141-149`.
- [ ] **T6] Página `src/pages/p/[slug].astro` (REQ-07):
  - Frontmatter llama `getPortfolioUrls(providerId, env)`.
  - Renderiza `<PortfolioGrid editable={false} items={items} />` o `<EmptyPortfolio />` si vacío.
  - Añade `Cache-Control: public, max-age=60, s-maxage=60`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/portfolio/render.test.ts` — `resolveR2PublicUrl` produce host correcto según env; orden por `sort_order`.
  - [ ] `tests/integration/portfolio/get-public.test.ts` — `GET /api/v1/providers/:id/portfolio` devuelve items ordenados; 404 si provider no existe; 410 si soft-deleted.
  - [ ] `tests/e2e/profile-portfolio.spec.ts` — visitar `/p/<slug>` muestra grid SSR con N imágenes; empty state si 0; segundo hit cae en cache.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `getPortfolioUrls`, no ordenar por `sort_order` → imágenes en orden aleatorio, test unitario rojo → restaurar
- [ ] Sabotaje 2: olvidar emitir `Cache-Control` con `max-age=60` → latencia aumenta, test E2E con headers rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/portfolio/render.ts`
- [ ] Type check verde
- [ ] Commit `feat: render portfolio público profile` y push