# HU-07.2 — Layout del perfil público

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver el perfil del prestador con foto, oficio, comuna y descripción
**Para** evaluar su perfil de un vistazo

## Criterios de aceptación (Gherkin)

### Escenario: Render SSR completo
  Dado un perfil publicado
  Cuando visito `/p/juan-gasfiter-las-condes`
  Entonces el HTML renderizado server-side contiene foto, oficio, comuna y descripción (sin spinner inicial)

### Escenario: Botones de contacto presentes
  Cuando renderiza el layout
  Entonces existen botones para WhatsApp, llamada y email
  Y cada botón tiene atributos `data-track-kind` y `data-provider-id`

### Escenario: Layout responsive en mobile
  Dado viewport 360x640
  Cuando renderiza
  Entonces el layout cambia a single-column sin overflow horizontal

## Tareas técnicas

- [ ] Componente `src/components/providers/PublicProfile.astro`
- [ ] Sub-componentes `Header`, `ContactButtons`, `Description`
- [ ] Vista `src/pages/p/[slug].astro` con SSR
- [ ] Tests `tests/e2e/profile-render.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
