# HU-27.1 — Esquema user_roles + migración data

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-27-multi-rol-cuenta
**Rama:** `feat/HU-27.1-schema-roles-multiples`

## Tareas técnicas

- [ ] **T1** Agregar tabla `userRoles` a `src/database/schema.ts` con PK auto-increment, FKs (user_id cascade, granted_by set null), columna `role` con enum `vecino|prestador|admin`, `grantedAt`, `grantedBy`. Unique index `(userId, role)`. Index secundario `(userId)`.
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_user_roles.sql` con `CREATE TABLE user_roles` + CHECK `role IN ('vecino','prestador','admin')` + UNIQUE index + FKs.
- [ ] **T3] Agregar al SQL de la migración el backfill: `INSERT OR IGNORE INTO user_roles(user_id, role, granted_at) SELECT id, role, unixepoch() FROM users WHERE role IS NOT NULL`.
- [ ] **T4** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio` que cada user legacy tiene 1 fila en `user_roles`.
- [ ] **T5** Validador `roleSchema` en `src/lib/validators/auth/roles.ts` con Zod enum.
- [ ] **T6** Servicio `src/lib/services/auth/roles.ts`:
  - `getUserRoles(env, userId)` — `SELECT DISTINCT role FROM user_roles WHERE user_id = ? ORDER BY role`.
  - `hasRole(env, userId, role)` — boolean.
  - `hasAnyRole(env, userId, roles[])` — boolean.
  - `addRole(env, userId, role, grantedBy?)` — INSERT OR IGNORE en user_roles (HU-27.2 lo usa con dual-write en users.role).
- [ ] **T7] Tests:
  - [ ] `tests/unit/validators/auth-roles.test.ts` — schema acepta `'vecino'`, `'prestador'`, `'admin'`; rechaza `'superhero'`, `null`, `123`.
  - [ ] `tests/integration/auth/roles-schema.test.ts` — migración aplica limpia; backfill crea 3 filas para 3 users con roles distintos; UNIQUE rechaza duplicado `(userId, role)`; CHECK rechaza `role='hacker'`; FK cascade: borrar user borra sus filas en user_roles; FK set null: borrar admin que otorgó deja granted_by=NULL.
  - [ ] `tests/unit/services/auth-roles.test.ts` (con mocks) — `getUserRoles` retorna array ordenado; `hasRole` true/false; `hasAnyRole(['prestador','admin'])` con user prestador → true.
  - [ ] Sabotaje 1: en la migración, olvidar el backfill `INSERT OR IGNORE` → users existentes sin filas en user_roles → test verifica que user legacy 'vecino' tiene al menos 1 fila → restaurar.
  - [ ] Sabotaje 2: en la tabla, olvidar el `uniqueIndex(userId, role)` → dos INSERTs del mismo `(user, role)` coexisten → test verifica UNIQUE en DB → restaurar.
  - [ ] Sabotaje 3: en `addRole`, hacer INSERT pero olvidar el dual-write en `users.role` → queries legacy que leen `users.role` no reflejan el nuevo rol → test verifica que tras `addRole('prestador')` el campo `users.role` también se actualiza → restaurar (sólo si la HU implementa dual-write; si no, documentar como follow-up).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/roles.ts` y `src/lib/validators/auth/roles.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: schema user_roles + backfill` y push a rama (no merge a main)