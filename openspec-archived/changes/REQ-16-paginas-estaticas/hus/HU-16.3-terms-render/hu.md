# HU-16.3 — Renderizar /terms con versión

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante
**Quiero** leer los términos y condiciones
**Para** conocer las reglas del servicio

## Criterios de aceptación (Gherkin)

### Escenario: /terms devuelve 200 y muestra versión
  Cuando solicito `GET /terms`
  Entonces recibo 200
  Y el HTML incluye "Versión: v1" según frontmatter

### Escenario: Versión se inserta en legal_versions si nueva
  Dado `terms.md` con `version: "v2"` no presente en `legal_versions`
  Cuando se renderiza la página por primera vez tras deploy (o se corre script)
  Entonces se inserta fila `(slug="terms", version="v2", published_at=now)`

## Tareas técnicas

- [ ] Vista `src/pages/terms.astro`
- [ ] Tabla `legal_versions` en `src/database/schema.ts`
- [ ] Helper `ensureLegalVersion(slug, version)`
- [ ] Tests `tests/integration/legal/versions.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
