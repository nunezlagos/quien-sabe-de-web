# HU-27.3 — Selector de rol activo en navbar

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-27-multi-rol-cuenta

## Historia de usuario

**Como** usuario con múltiples roles
**Quiero** cambiar entre dashboards de vecino y prestador
**Para** operar en el contexto correcto

## Criterios de aceptación (Gherkin)

### Escenario: Navbar muestra selector si > 1 rol
  Dado user con roles ["vecino","prestador"]
  Cuando carga cualquier página
  Entonces el navbar (estilo `mockups/dashboard-user.html:15-25`) muestra dropdown con etiquetas "Vecino" / "Prestador"

### Escenario: Cambio actualiza cookie y redirige
  Cuando hago clic en "Prestador"
  Entonces se setea cookie `active_role=prestador`
  Y se redirige a `/dashboard-provider`

### Escenario: Usuario con 1 rol no ve selector
  Dado user sólo vecino
  Cuando carga navbar
  Entonces el selector está oculto

### Escenario: Server-side respeta active_role
  Cuando llega request con cookie `active_role=prestador` pero header API requiere vecino
  Entonces middleware fallback acepta si user tiene el rol requerido (HU-27.4)

## Tareas técnicas

- [ ] Componente `<RoleSwitcher />` en `src/components/navbar/RoleSwitcher.astro`
- [ ] Insertar en navbar global (`src/layouts/Layout.astro`)
- [ ] Cookie `active_role` firmada con HMAC (compartir helper con HU-22.1)
- [ ] Tests E2E `tests/e2e/role-switcher.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
