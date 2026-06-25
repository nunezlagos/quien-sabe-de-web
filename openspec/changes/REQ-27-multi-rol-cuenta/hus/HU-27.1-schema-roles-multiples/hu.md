# HU-27.1 — Esquema user_roles + migración data

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-27-multi-rol-cuenta

## Historia de usuario

**Como** plataforma
**Quiero** permitir múltiples roles por usuario
**Para** que un vecino pueda ser también prestador

## Criterios de aceptación (Gherkin)

### Escenario: Tabla user_roles creada
  Cuando aplico migración
  Entonces existe `user_roles (user_id, role, granted_at, granted_by)` con UNIQUE `(user_id, role)`

### Escenario: Backfill desde users.role
  Cuando ejecuto la migración data
  Entonces cada user existente queda con su rol previo en `user_roles`
  Y `users.role` se mantiene (deprecated, dual-write durante 1 release)

### Escenario: Constraint role enum
  Cuando intento insertar role="superhero"
  Entonces falla con CHECK `role IN ('vecino','prestador','admin')`

### Escenario: granted_by para admin auditoría
  Cuando un admin promueve a otro admin
  Entonces `granted_by` queda con su user_id

## Tareas técnicas

- [ ] Modificar `src/database/schema.ts` agregando `userRoles`
- [ ] Script migración data `src/database/migrations/<n>-user-roles-backfill.sql`
- [ ] Helper `getUserRoles(userId)` en `src/lib/services/auth/roles.ts`
- [ ] Tests `tests/integration/auth/roles-schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
