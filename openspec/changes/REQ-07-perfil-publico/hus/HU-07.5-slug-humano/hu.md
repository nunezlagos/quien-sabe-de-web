# HU-07.5 — Slug humano y redirect desde ?id=

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** visitante anónimo
**Quiero** tener URLs legibles para los perfiles
**Para** que el link se entienda y mejore SEO

## Criterios de aceptación (Gherkin)

### Escenario: Slug generado al crear perfil
  Dado un prestador "Juan Pérez" con oficio gasfiter y comuna Las Condes
  Cuando crea su perfil
  Entonces `slug = "juan-perez-gasfiter-las-condes"`

### Escenario: Colisión agrega sufijo numérico
  Dado ya existe `juan-perez-gasfiter-las-condes`
  Cuando se crea otro perfil que generaría el mismo slug
  Entonces el nuevo slug es `juan-perez-gasfiter-las-condes-2`

### Escenario: Redirect de /profile?id=42 al slug
  Dado un prestador con id=42 y slug "juan-...-las-condes"
  Cuando visito `/profile?id=42`
  Entonces recibo status 301 hacia `/p/juan-perez-gasfiter-las-condes`

## Tareas técnicas

- [ ] Helper `generateSlug` extendido con dedupe en `src/lib/utils/slug.ts`
- [ ] Migración para indexar `providers.slug` UNIQUE
- [ ] Vista `src/pages/profile.astro` con redirect 301
- [ ] Tests `tests/unit/utils/slug.test.ts`, `tests/integration/providers/slug-redirect.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
