# HU-12.3 — Sección de edición de perfil inline

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** editar mi perfil desde el dashboard sin redirect
**Para** iterar más rápido sobre mi presencia

## Criterios de aceptación (Gherkin)

### Escenario: Editar descripción inline
  Dado un prestador en `/dashboard-provider#perfil`
  Cuando edita la descripción y guarda
  Entonces se invoca `PATCH /api/v1/providers/me` y los datos persisten

### Escenario: Editar oficio dispara reindex (link a REQ-04.5)
  Cuando cambia el oficio
  Entonces se ve un toast "indexando..."
  Y los resultados de búsqueda reflejan el cambio

### Escenario: Validación inline de hourly_rate_clp
  Cuando ingresa valor negativo
  Entonces se muestra error en el campo sin enviar request

## Tareas técnicas

- [ ] Componente `src/components/dashboard/provider/ProfileSection.astro`
- [ ] Reuso de endpoint `PATCH /api/v1/providers/me` (REQ-04)
- [ ] Tests `tests/e2e/provider-edit-profile.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
