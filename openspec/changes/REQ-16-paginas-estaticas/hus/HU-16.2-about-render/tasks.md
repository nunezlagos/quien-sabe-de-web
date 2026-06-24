# HU-16.2 — Renderizar /about

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.2-about-render`

## Tareas tecnicas

- [ ] **T1** Crear `src/layouts/LegalLayout.astro` con slots: default (contenido), `updatedAt` (texto de fecha), `footer-extra` (opcional). Reusa `BaseLayout.astro` por debajo y aplica `bg-bg-light` y max-w-4xl.
- [ ] **T2** Reemplazar el contenido de `src/content/legal/about.md` con el copy del mockup `mockups/about.html:1-130` (secciones: hero, opciones, transparencia, misión). Frontmatter: `title`, `description`, `version: "v1"`, `updated_at`.
- [ ] **T3** Implementar `src/pages/about.astro` con `getEntry('legal','about')`, `entry.render()` y render de `<Content />` dentro de `<LegalLayout>`. Helper local de formato de fecha `es-CL` con fallback `es`.
- [ ] **T4** Verificar build local: `docker exec quien-sabe-app bunx astro build` no debe fallar; inspeccionar `dist/about/index.html` contiene `<h1>` y "Última actualización".
- [ ] **T5** Tests:
  - [ ] `tests/unit/layouts/legal-layout.test.ts` — slot default se renderiza, slot `updatedAt` aparece, slot omitido no rompe.
  - [ ] `tests/unit/utils/date-format.test.ts` — `formatLongDate(new Date('2026-01-15'))` retorna string con mes en español.
  - [ ] `tests/integration/pages/about.test.ts` — `getEntry('legal','about')` resuelve; frontmatter completo; `entry.body` no vacío.
  - [ ] `tests/e2e/about-page.spec.ts` — `page.goto('/about')` → status 200, locator `h1` contiene title, locator footer contiene "Última actualización".
- [ ] **T6** Correr `docker exec quien-sabe-app bunx astro sync` y commitear `src/content.d.ts` regenerado.

## Sabotajes a confirmar

1. Cambiar `src/content/legal/about.md` quitando el `## Objetivo` que arma la sección de transparencia → test E2E falla al no encontrar la subsección esperada (o el snapshot cambia) → restaurar.
2. En `LegalLayout.astro`, eliminar la prop `description` pasada al `<head>` → test E2E que asertea `<meta name="description">` falla → restaurar.
3. Cambiar el helper de fecha para que devuelva `'2026-01-15'` ISO en vez de formato largo → test unitario rojo → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/layouts tests/unit/utils/date-format.test.ts tests/integration/pages/about.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/about-page.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: copy incompleto → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: falta `description` meta → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: formato de fecha rompe contrato → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/layouts/LegalLayout.astro` y helper de fecha
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: render /about desde content collection` y push a rama (no merge a main)
