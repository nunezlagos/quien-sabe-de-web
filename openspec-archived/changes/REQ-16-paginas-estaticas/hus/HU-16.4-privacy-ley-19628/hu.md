# HU-16.4 — Página /privacy cumpliendo Ley 19.628

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante / titular de datos
**Quiero** ver los datos recolectados, finalidad y mis derechos
**Para** cumplir la ley chilena de protección de datos

## Criterios de aceptación (Gherkin)

### Escenario: /privacy lista categorías de datos
  Cuando solicito `GET /privacy`
  Entonces el HTML incluye secciones: "Datos recolectados", "Finalidad", "Conservación", "Derechos del titular (ARCO+P)", "Contacto del responsable"

### Escenario: Contacto del responsable presente
  Cuando se renderiza
  Entonces existe un email de contacto para ejercer derechos (ej. `privacidad@quien-sabe-de-web.cl`)

### Escenario: Versión versionada igual que terms
  Cuando `privacy.md` tiene `version: "v1"`
  Entonces aparece "Versión: v1"

## Tareas técnicas

- [ ] Contenido `src/content/legal/privacy.md` con secciones obligatorias
- [ ] Vista `src/pages/privacy.astro`
- [ ] Tests `tests/e2e/privacy-ley-19628.spec.ts` (asserta secciones por id)

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
