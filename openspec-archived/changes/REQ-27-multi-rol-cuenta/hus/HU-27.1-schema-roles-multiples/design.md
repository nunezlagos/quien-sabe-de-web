# Diseño técnico — HU-27.1 — Esquema user_roles + migración data

**REQ padre:** REQ-27-multi-rol-cuenta

## Modelo de datos

### Nueva tabla Drizzle

```ts
// src/database/schema.ts
export const userRoles = sqliteTable('user_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['vecino', 'prestador', 'admin'] }).notNull(),
  grantedAt: integer('granted_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  grantedBy: integer('granted_by').references(() => users.id, { onDelete: 'set null' }),  // NULL = auto-asignado en registro
}, (t) => ({
  uniqueUserRole: uniqueIndex('idx_user_roles_unique').on(t.userId, t.role),
  byUser: index('idx_user_roles_user').on(t.userId),
  // CHECK role IN ('vecino','prestador','admin') declarado en migración SQL
}))
```

### Migración Drizzle

`src/database/migrations/00XX_user_roles.sql`:
1. `CREATE TABLE user_roles (...)` con UNIQUE + índices.
2. `CHECK (role IN ('vecino','prestador','admin'))`.
3. Foreign keys con `ON DELETE CASCADE` (user) y `ON DELETE SET NULL` (granted_by).
4. Backfill: `INSERT OR IGNORE INTO user_roles(user_id, role, granted_at) SELECT id, role, unixepoch() FROM users WHERE role IS NOT NULL`.

### Tabla `users` (sin cambios en esta HU)
- `users.role` se mantiene como deprecated. Dual-write en HU-27.2.
- Eliminación programada para release posterior (fuera de scope de esta HU).

## Contrato de API

No aplica. Esta HU es DDL puro. Los endpoints que consultan/modifican esta tabla viven en HU-27.2.

## Validaciones Zod

```ts
// src/lib/validators/auth/roles.ts
export const roleSchema = z.enum(['vecino', 'prestador', 'admin'])

export const addRoleSchema = z.object({
  role: roleSchema,
})
```

## Componentes UI

No aplica.

## Flujo de interacción (secuencial)

1. Se actualiza `src/database/schema.ts` agregando `userRoles`.
2. Se ejecuta `docker exec quien-sabe-app bun run db:generate` para producir la migración.
3. Se aplica con `docker exec quien-sabe-app bun run db:migrate:local`.
4. Backfill ejecuta automáticamente como parte de la migración SQL.
5. Verificar con `make studio` que cada user legacy tiene 1 fila en `user_roles`.
6. HU-27.2 (activar rol) consume el helper `getUserRoles` para verificar roles actuales antes del INSERT.

## Capa de servicios

- `src/lib/services/auth/roles.ts`:
  - `getUserRoles(env, userId): Promise<Role[]>` — `SELECT DISTINCT role FROM user_roles WHERE user_id = ? ORDER BY role`.
  - `hasRole(env, userId, role): Promise<boolean>` — `SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1`.
  - `hasAnyRole(env, userId, roles: Role[]): Promise<boolean>` — usado por HU-27.4.
  - `addRole(env, userId, role, grantedBy?): Promise<void>` — INSERT OR IGNORE en user_roles + UPDATE users.role (dual-write).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/auth-roles.test.ts` — `roleSchema` acepta los 3 valores; rechaza `"superhero"`, `null`, número. |
| Integración | `tests/integration/auth/roles-schema.test.ts` — migración aplica; backfill crea filas para users con `role IS NOT NULL`; UNIQUE `(user_id, role)` rechaza duplicado; CHECK rechaza role fuera de enum; FK cascade borra filas al borrar user; FK set null en granted_by al borrar admin que otorgó. |
| Unit | `tests/unit/services/auth-roles.test.ts` — `getUserRoles` retorna array de roles del user; `hasRole` true/false; `hasAnyRole` con múltiples roles. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (tabla `users` con `role`).
- **Bloquea a:** HU-27.2 (endpoint POST /roles/prestador usa `addRole`), HU-27.3 (selector lee `getUserRoles`), HU-27.4 (middleware usa `hasAnyRole`).
- **Recursos compartidos:** `src/database/schema.ts`, `src/lib/services/auth/`.

## Riesgos técnicos

- Riesgo: el backfill INSERT OR IGNORE omite users que ya tienen fila en user_roles (de tests previos) → Mitigación: documentar que la migración es idempotente; si el backfill se corre múltiples veces, sólo añade filas para nuevos users.
- Riesgo: el dual-write en HU-27.2 introduce overhead → Mitigación: aceptable; las queries a `users.role` son legacy y se eliminarán en release posterior.
- Riesgo: `grantedBy` queda NULL para usuarios auto-registrados → Mitigación: documentar convención; tests verifican que auto-asignación setea `granted_by = NULL`, asignación admin setea `granted_by = adminUserId`.