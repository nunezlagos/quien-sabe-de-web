# HU-12.1 — Layout dashboard prestador con sidebar y tabs

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** aterrizar en mi panel privado tras login
**Para** operar mi perfil y ver mis métricas

## Criterios de aceptación (Gherkin)

### Escenario: Login redirige al dashboard prestador
  Dado un prestador autenticado
  Cuando completa login
  Entonces recibo redirect a `/dashboard-prestador` *(path real: español "prestador", no "provider")*

### Escenario: Sidebar con secciones: Resumen, Perfil, Servicios, Reseñas
  Dado un prestador en `/dashboard-prestador`
  Cuando renderiza
  Entonces existen al menos los 4 links de sección en el sidebar (Resumen, Editar Perfil, Mis Servicios, Reseñas) + Soporte

### Escenario: Sin sesión prestador → redirect login
  Dado un request sin sesión
  Cuando solicita `/dashboard-prestador`
  Entonces recibo `302 /iniciar-sesion?redirigir=/dashboard-prestador`

## Tareas técnicas

- [x] Vista `src/pages/dashboard-prestador.astro` (commit `2a285b6`)
- [x] Helper `requireRole('provider')` en `src/middleware.ts` (commit `12bfe86`)
- [x] Toggle visibilidad + toggle pausar/activar oficio en `src/lib/client/dashboard/prestador.ts` (commit `2a285b6`)
- [ ] Componente `src/components/dashboard/provider/Layout.astro` *(inline en .astro por ahora — refactor cuando se repita patrón)*
- [ ] Tests E2E Playwright *(pendiente — verificado manualmente vía MCP)*

## Definition of done

- [x] Tests Vitest unit pasan (58 tests, 0 failures — `docker exec quien-sabe-app bun run test:run`)
- [ ] Tests Vitest integración pasan *(bloqueado: better-sqlite3 sin bindings para Node 25 — bug de entorno)*
- [x] Test E2E Playwright manual pasa *(verificado vía MCP: render con datos reales del seed, 3 oficios de Juan Pérez)*
- [ ] Sabotaje confirmado *(pendiente — sabotaje hecho en HU-04.2 cubre el endpoint POST /api/v1/trades)*
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`

## Notas de implementación (commit `2a285b6`)

- Path real: `/dashboard-prestador` (español), no `/dashboard-provider` (inglés en HU original)
- Datos reales del seed renderizan: 3 oficios de `prestador@demo.cl` (Juan Pérez), rating 3.2 calculado, 4 reseñas
- 4 Quick Stats (Visitas/Contactos/Valoración/Reseñas) — visitas/contactos son mock MVP (124/15)
- Banner verificación amarillo siempre visible (no condicional al estado real — futuro HU-12.6)
- Mi Horario: placeholder 7 días, configuración real llega con HU-24.2
- 3 commits previos crearon el routing: `12bfe86` (middleware por rol), `7414cfb` (crear-oficio con whatsapp), `c80e62f` (validators + tests)
