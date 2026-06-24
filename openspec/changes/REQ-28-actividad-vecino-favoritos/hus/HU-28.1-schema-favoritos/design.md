# Diseño técnico — HU-28.1 — Esquema user_favorites

**REQ padre:** REQ-28-actividad-vecino-favoritos

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const userFavorites = sqliteTable('user_favorites', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.providerId] }),
  idxUserRecent: index('idx_user_favorites_user_created')
    .on(t.userId, t.createdAt.desc()),
}))
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/NNNN_user_favorites.sql`
- Cambios:
  - `CREATE TABLE user_favorites` con PK compuesta `(user_id, provider_id)`.
  - `CREATE INDEX idx_user_favorites_user_created` sobre `(user_id, created_at DESC)`.
  - FK `user_id → users.id ON DELETE CASCADE`.
  - FK `provider_id → providers.id ON DELETE CASCADE` (filtrado de
    soft-delete se hace en query, no en cascade).

## Contrato de API

No expone endpoints propios. Los endpoints viven en HU-28.2 y HU-28.3.

## Validaciones Zod

No aplica en esta HU (sin endpoints). Las validaciones de payload se
definen en HU-28.2.

## Componentes UI

No aplica. HU 100 % backend / schema. La superficie visual la entrega
HU-28.3 contra `mockups/dashboard-user.html:71-97`.

## Flujo de interacción (secuencial)

1. Operador ejecuta `docker exec quien-sabe-app bun run db:generate`.
2. Drizzle genera SQL de migración a partir del schema actualizado.
3. Operador ejecuta `docker exec quien-sabe-app bun run db:migrate:local`.
4. D1 local aplica la migración y crea la tabla más el índice.
5. Helpers en `src/lib/services/activity/favorites.ts` quedan listos
   para ser consumidos por HU-28.2 y HU-28.3.

## Capa de servicios

- `src/lib/services/activity/favorites.ts`
  - `listFavorites(db, userId: string, limit?: number): Promise<FavoriteRow[]>`
    — join con `providers`, filtra `deleted_at IS NULL`, orden
    `created_at DESC`, default limit razonable.
  - `addFavorite(db, userId, providerId): Promise<void>` — idempotente
    (insert-or-ignore por PK).
  - `removeFavorite(db, userId, providerId): Promise<void>` — delete
    por PK, no falla si no existe.
  - `isFavorite(db, userId, providerId): Promise<boolean>` — exists.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/favorites/schema.test.ts` | Estructura de tabla, FKs, PK compuesta |
| Unit | `tests/unit/favorites/list-favorites.test.ts` | Orden por `created_at DESC`, exclusión de soft-deleted |
| Integración | `tests/integration/favorites/migration.test.ts` | Migración aplica limpia contra D1 in-memory |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (esquema `users`), REQ-04 (esquema `providers`).
- **Bloquea a:** HU-28.2, HU-28.3.
- **Recursos compartidos:** `src/database/schema.ts`, carpeta de
  migraciones `src/database/migrations/`.

## Riesgos técnicos

- Riesgo: divergencia entre snapshot Drizzle y SQL aplicado →
  Mitigación: regenerar migración en el mismo commit que modifica
  `schema.ts`.
- Riesgo: cascade desde `providers` borra historial → Mitigación: este
  proyecto usa soft-delete en `providers`, el cascade físico solo
  dispara si se hace hard-delete (decisión consciente).
