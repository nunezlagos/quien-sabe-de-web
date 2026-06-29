# HU-16.1 — Content collection para legal en Markdown

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** sistema
**Quiero** tener una content collection Astro para páginas legales
**Para** editar /about, /terms, /privacy, /faq sin redeploy de código

## Criterios de aceptación (Gherkin)

### Escenario: Collection definida y tipada
  Dado `src/content/config.ts` define `legal` collection con schema Zod
  Cuando Astro arranca
  Entonces los archivos Markdown en `src/content/legal/` son enumerables

### Escenario: Frontmatter requerido
  Dado un archivo `about.md` sin `title`
  Cuando Astro valida
  Entonces falla en build con error de schema

### Escenario: Lectura programática
  Cuando invoco `getEntry("legal", "about")`
  Entonces recibo `{ data: { title, version, updated_at }, body }`

## Tareas técnicas

- [ ] Config `src/content/config.ts` con schema Zod
- [ ] Stubs iniciales `src/content/legal/about.md`, `terms.md`, `privacy.md`, `faq.md`
- [ ] Tests `tests/unit/content/legal-collection.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
