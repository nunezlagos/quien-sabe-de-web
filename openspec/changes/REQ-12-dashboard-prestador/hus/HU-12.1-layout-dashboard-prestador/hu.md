# HU-12.1 — Layout dashboard prestador con sidebar y tabs

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** aterrizar en mi panel privado tras login
**Para** operar mi perfil y ver mis métricas

## Criterios de aceptación (Gherkin)

### Escenario: Login redirige al dashboard prestador
  Dado un prestador autenticado
  Cuando completa login
  Entonces recibo redirect a `/dashboard-provider`

### Escenario: Sidebar con secciones: Resumen, Perfil, Servicios, Reseñas
  Dado un prestador en `/dashboard-provider`
  Cuando renderiza
  Entonces existen al menos los 4 links de sección en el sidebar

### Escenario: Sin sesión prestador → redirect login
  Dado un request sin sesión
  Cuando solicita `/dashboard-provider`
  Entonces recibo `302 /login?next=/dashboard-provider`

## Tareas técnicas

- [ ] Vista `src/pages/dashboard-provider.astro`
- [ ] Componente `src/components/dashboard/provider/Layout.astro` con sidebar
- [ ] Helper `requireRole('prestador')` en middleware
- [ ] Tests `tests/e2e/dashboard-provider-layout.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
