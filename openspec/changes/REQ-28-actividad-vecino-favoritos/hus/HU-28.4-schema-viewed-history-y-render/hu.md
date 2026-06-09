# HU-28.4 — Schema user_views + sección Recientes

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Historia de usuario

**Como** vecino
**Quiero** ver mis últimas búsquedas/perfiles visitados
**Para** retomar sin perder tiempo

## Criterios de aceptación (Gherkin)

### Escenario: View registrada al visitar perfil
  Dado vecino logueado
  Cuando carga `/p/juan-perez-gasfiter`
  Entonces se invoca `POST /api/v1/providers/:id/views` (SSR side effect)
  Y se inserta fila en `user_views` salvo que exista una < 1h del mismo par

### Escenario: Dedupe < 1h
  Dado view registrada hace 30 min
  Cuando visito el mismo perfil
  Entonces no se inserta nueva fila

### Escenario: Render sección Recientes
  Cuando navego a `/dashboard-user`
  Entonces la sección "Recientes" (`mockups/dashboard-user.html:100-112`) muestra mis últimas 5 vistas
  Y cada item replica el patrón `<li class="flex items-center gap-3 text-sm text-gray-600">` (línea 103-110) con icono `ri-user-line` o `ri-search-line` según tipo

### Escenario: Trim a 50 por usuario
  Cuando cron mensual corre
  Entonces se eliminan filas excedentes manteniendo las 50 más recientes por user

### Escenario: Sin viewed → empty state
  Cuando user sin actividad
  Entonces se muestra "Sin actividad reciente"

## Tareas técnicas

- [ ] Modificar `src/database/schema.ts` con `userViews`
- [ ] Servicio `recordView(userId, providerId)` con dedupe via KV (`view_dedupe:<user>:<provider>` TTL 3600)
- [ ] Endpoint `src/pages/api/v1/users/me/views.ts` (GET)
- [ ] Componente `<RecentViews />` en `src/components/activity/RecentViews.astro` portando markup del mockup
- [ ] Cron mensual de trim (configurar en REQ-26.5 o CF cron)
- [ ] Tests `tests/integration/views/record-and-list.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
