# HU-23.1 — Esquema portfolio_images con límite 5

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-23-portfolio-prestador
**Rama:** `feat/HU-23.1-schema-portfolio-images`

## Tareas técnicas

- [ ] **T1** Agregar tabla `portfolio_images` a `src/database/schema.ts` (id autoincrement, providerId FK→providers, r2Key, sortOrder, createdAt) con `uniqueIndex(uq_portfolio_provider_order)` y `index(idx_portfolio_provider)`.
- [ ] **T2** Servicio `src/lib/services/portfolio/limits.ts` con `assertPortfolioCapacity(db, providerId)` (lanza si cuenta ≥ 5), `nextSortOrder(db, providerId)` (max+1 ó 0), `compactSortOrder(db, providerId)` (recompacting a 0..n-1).
- [ ] **T3** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_portfolio_images.sql` con `CREATE TABLE`, `CREATE UNIQUE INDEX`, `CREATE INDEX`, FK `provider_id REFERENCES providers(id) ON DELETE CASCADE`.
- [ ] **T4** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T5** Tipo exportado `PortfolioImageRow` desde `src/database/schema.ts` para uso en HU-23.2+ y validación en `src/lib/validators/portfolio.ts`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/portfolio/limits.test.ts` — `assertPortfolioCapacity` lanza al 6º, `nextSortOrder` devuelve 0..4 en orden, `compactSortOrder` reasigna a 0..n-1.
  - [ ] `tests/integration/portfolio/schema.test.ts` — UNIQUE `(provider_id, sort_order)` rechaza duplicados, FK rechaza `provider_id` inexistente.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: eliminar UNIQUE `(provider_id, sort_order)` → insert duplicado pasa, test integración rojo → restaurar
- [ ] Sabotaje 2: en `compactSortOrder`, olvidar restar 1 → quedan huecos en `sort_order`, test unitario rojo → restaurar
- [ ] Type check verde
- [ ] Commit `feat: schema portfolio_images + límites` y push