# HU-28.1 — Esquema user_favorites

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Historia de usuario

**Como** plataforma
**Quiero** persistir favoritos por usuario
**Para** alimentar la sección "Vecinos Guardados" del dashboard

## Criterios de aceptación (Gherkin)

### Escenario: Tabla user_favorites creada
  Cuando aplico migración
  Entonces existe `user_favorites (user_id, provider_id, created_at)` con PK compuesta `(user_id, provider_id)`

### Escenario: Índice DESC para listado
  Cuando consulto schema
  Entonces existe índice `(user_id, created_at DESC)` para ordenar por reciente

### Escenario: FK con cascade vecino borrado
  Cuando se elimina un user (HU-22.4)
  Entonces sus favoritos se eliminan en cascada

### Escenario: FK con set null prestador deleted
  Cuando provider queda soft-deleted
  Entonces favoritos no se muestran (filtrado en query, no cascade)

## Tareas técnicas

- [ ] Modificar `src/database/schema.ts` agregando `userFavorites`
- [ ] Migración Drizzle correspondiente
- [ ] Helper `listFavorites(userId, limit)` en `src/lib/services/activity/favorites.ts`
- [ ] Tests `tests/unit/favorites/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
