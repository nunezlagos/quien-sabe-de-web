# HU-12.7 — Preview público en modal iframe

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver mi perfil público sin abandonar el dashboard
**Para** iterar diseño sin perder contexto

## Criterios de aceptación (Gherkin)

### Escenario: Abrir preview en modal
  Cuando clickea "Ver mi perfil público"
  Entonces se abre un modal con `<iframe src="/p/<slug>?preview=true">`

### Escenario: Cerrar modal mantiene scroll
  Cuando cierra el modal
  Entonces vuelve al dashboard en el mismo punto de scroll

### Escenario: Preview refleja cambios pendientes
  Cuando edita descripción y reabre preview
  Entonces el iframe muestra el cambio recién guardado

## Tareas técnicas

- [ ] Componente `src/components/dashboard/provider/PreviewModal.astro`
- [ ] Reuso de `/p/[slug]?preview=true` (REQ-04.4)
- [ ] Tests `tests/e2e/provider-preview-modal.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
