# HU-16.2 — Renderizar /about

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante
**Quiero** leer la página About
**Para** saber quiénes somos

## Criterios de aceptación (Gherkin)

### Escenario: /about devuelve 200
  Cuando solicito `GET /about`
  Entonces recibo status 200
  Y el HTML incluye `<h1>` con el título configurado

### Escenario: Markdown se renderiza a HTML
  Dado `about.md` con encabezado H2
  Cuando se renderiza
  Entonces el HTML incluye `<h2>` correspondiente

### Escenario: Updated_at visible
  Cuando se renderiza
  Entonces aparece "Última actualización: <fecha>" en el pie

## Tareas técnicas

- [ ] Vista `src/pages/about.astro`
- [ ] Layout `src/layouts/LegalLayout.astro`
- [ ] Tests `tests/e2e/about-page.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
