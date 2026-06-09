# HU-04.4 — Vista preview del perfil antes de publicar

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver cómo se verá mi perfil público antes de publicarlo
**Para** evitar publicar errores o información incompleta

## Criterios de aceptación (Gherkin)

### Escenario: Preview de perfil draft
  Dado un prestador con `status="draft"`
  Cuando navega a `/dashboard-provider#preview`
  Entonces ve un iframe apuntando a `/p/<slug>?preview=true`
  Y la página renderiza con badge "VISTA PREVIA"

### Escenario: Preview no es accesible para terceros
  Dado un visitante anónimo intenta `/p/<slug>?preview=true` para un perfil draft
  Cuando solicita la página
  Entonces recibo status 404

### Escenario: Publicar desde preview
  Cuando el prestador clickea "Publicar" en `/dashboard-provider#preview`
  Entonces se envía `PATCH /api/v1/providers/me` con `{"status":"published"}`
  Y el perfil aparece en búsqueda pública (REQ-06)

## Tareas técnicas

- [ ] Componente `src/components/dashboard/provider/Preview.astro`
- [ ] Lógica en `src/pages/p/[slug].astro` que reconoce query `preview=true` y verifica sesión propia
- [ ] Toggle de publicación desde dashboard
- [ ] Tests `tests/integration/providers/preview.test.ts`, `tests/e2e/provider-preview.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
