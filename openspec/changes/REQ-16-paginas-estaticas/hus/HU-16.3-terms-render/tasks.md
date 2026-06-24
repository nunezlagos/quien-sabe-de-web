# HU-16.3 — Renderizar /terms con version

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.3-terms-render`

## Tareas tecnicas

- [ ] **T1** Confirmar / crear la tabla `legal_versions` en `src/database/schema.ts` con columnas `id`, `slug` (enum), `version` (text), `publishedAt` (timestamp) y UNIQUE `(slug, version)`. Generar migración con `docker exec quien-sabe-app bun run db:generate` y aplicarla con `db:migrate:local`.
- [ ] **T2** Validador `ensureLegalVersionInputSchema` en `src/lib/validators/legal.ts` con Zod (slug enum, version regex `^v\d+$`).
- [ ] **T3** Servicio `src/lib/services/legal-versions.ts` con `ensureLegalVersion(db, { slug, version })` que hace `INSERT ... ON CONFLICT (slug, version) DO NOTHING` y retorna `{ inserted: boolean }`. Si el adapter es undefined (build SSG sin runtime), la función hace skip + log de warning (no falla el build).
- [ ] **T4** Reemplazar `src/content/legal/terms.md` con el copy del mockup `mockups/terms.html:42-68` (4 secciones) más frontmatter completo (`title`, `description`, `version: "v1"`, `updated_at`).
- [ ] **T5** Implementar `src/pages/terms.astro` con `getEntry('legal','terms')`, llamada a `ensureLegalVersion` en frontmatter, render `<Content />` dentro de `<LegalLayout>`, slot `version` con "Versión: vN".
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/legal.test.ts` — `ensureLegalVersionInputSchema` acepta válido, rechaza slug desconocido, rechaza version con formato libre.
  - [ ] `tests/integration/legal/versions.test.ts` — primera llamada inserta fila, segunda llamada con misma key es no-op, llamadas con version distinta insertan otra fila, UNIQUE constraint activo (insert manual SQL falla).
  - [ ] `tests/e2e/terms-page.spec.ts` — `page.goto('/terms')` → 200, HTML contiene "Versión: v1", H1 = title del frontmatter, link "Volver" presente.
- [ ] **T7** Verificar build: `docker exec quien-sabe-app bunx astro build` + `docker exec quien-sabe-app bun run db:migrate:local`; consultar `legal_versions` con `make studio` y validar 1 fila para `terms`.

## Sabotajes a confirmar

1. En `legal-versions.ts`, quitar `.onConflictDoNothing(...)` → segunda llamada con misma key falla con UNIQUE violation (test integración rojo) → restaurar.
2. Cambiar `version: "v1"` por `version: "Version-1"` en `terms.md` → el validador Zod del frontmatter (HU-16.1) rompe el build; test e2e/page falla porque el slot `version` no se renderiza.
3. Borrar la llamada a `ensureLegalVersion` en `terms.astro` → test de integración que mockea la página o el snapshot E2E que verifica la fila en `legal_versions` falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/legal.test.ts tests/integration/legal/versions.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/terms-page.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: falta `onConflictDoNothing` → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: version inválida → build / test rojo → restaurar
- [ ] Sabotaje 3 confirmado: llamada removida → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/legal-versions.ts` y `src/lib/validators/legal.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: render /terms + tabla legal_versions` y push a rama (no merge a main)
