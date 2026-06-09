# HU-12.4 — Sección de gestión de servicios inline

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** administrar mis servicios desde el dashboard
**Para** centralizar mi operación

## Criterios de aceptación (Gherkin)

### Escenario: Listar servicios con CTA crear
  Dado un prestador con 3 servicios
  Cuando entra a `/dashboard-provider#servicios`
  Entonces ve los 3 con botón "Crear servicio"

### Escenario: Crear servicio desde la sección
  Cuando completa el form de creación
  Entonces se invoca `POST /api/v1/providers/me/services`
  Y aparece en la lista

### Escenario: Editar y desactivar inline
  Cuando toggle "Activo"
  Entonces se invoca `PATCH` con nuevo `status`
  Y el servicio se ve atenuado si está inactivo

## Tareas técnicas

- [ ] Componente `src/components/dashboard/provider/ServicesSection.astro`
- [ ] Reuso endpoints REQ-05
- [ ] Tests `tests/e2e/provider-services-section.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
