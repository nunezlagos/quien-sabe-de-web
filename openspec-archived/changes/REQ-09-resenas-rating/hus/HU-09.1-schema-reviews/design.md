# Diseno tecnico — HU-09.1 — Schema reviews + review_responses

**REQ padre:** REQ-09-resenas-rating

## Modelo de datos

### Tablas Drizzle (pseudocodigo)

```ts
// src/database/schema.ts (extracto)
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // CHECK 1..5 via SQL
  body: text('body'), // NULL permitido
  status: text('status', { enum: ['visible', 'hidden'] }).notNull().default('visible'),
  hiddenReason: text('hidden_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  editedUntil: integer('edited_until', { mode: 'timestamp' }).notNull(), // = createdAt + 7d
}, (t) => ({
  uniqUserProvider: uniqueIndex('uniq_reviews_user_provider').on(t.userId, t.providerId),
  byProviderVisibleCreated: index('idx_reviews_provider_visible_created')
    .on(t.providerId, t.status, t.createdAt, t.id),
  // CHECKs en la migración SQL
}));

export const reviewResponses = sqliteTable('review_responses', {
  reviewId: integer('review_id').primaryKey()
    .references(() => reviews.id, { onDelete: 'cascade' }),
  body: text('body').notNull(), // CHECK length(body) <= 500 via SQL
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

### Migracion Drizzle

Archivo: `src/database/migrations/00XX_reviews.sql`:

- `CREATE TABLE reviews (...)` con:
  - `CHECK (rating BETWEEN 1 AND 5)`
  - `CHECK (status IN ('visible','hidden'))`
  - `CHECK (length(body) <= 1000)` (HU-09.2)
  - `UNIQUE (user_id, provider_id)`
- `CREATE INDEX idx_reviews_provider_visible_created ON reviews(provider_id, status, created_at DESC, id DESC);`
- `CREATE TABLE review_responses (...)` con:
  - PK `review_id` (relación 1-a-1)
  - FK a `reviews(id) ON DELETE CASCADE`
  - `CHECK (length(body) <= 500)`
  - `CHECK (length(body) >= 1)`

## Contrato de API

No aplica. HU 100% backend (DDL). Las HUs 09.2-09.6 exponen los endpoints que usan estas tablas.

## Validaciones Zod

```ts
// src/lib/validators/reviews.ts (firmas)
export const reviewRatingSchema = z.number().int().min(1).max(5);
export const reviewStatusSchema = z.enum(['visible', 'hidden']);
export const reviewBodySchema = z.string().max(1000).nullable();

// usado por HU-09.2 (POST) y HU-09.3 (PATCH)
export const reviewInsertSchema = z.object({
  providerId: z.number().int().positive(),
  rating: reviewRatingSchema,
  body: reviewBodySchema,
});

// usado por HU-09.4 (POST response)
export const reviewResponseInsertSchema = z.object({
  body: z.string().min(1).max(500),
});
```

## Componentes UI

No aplica. Backend puro.

## Flujo de interaccion (secuencial)

1. Editar `src/database/schema.ts` agregando `reviews` y `reviewResponses`.
2. `docker exec quien-sabe-app bun run db:generate` produce la migración.
3. Revisar el SQL generado; agregar CHECKs manualmente si `drizzle-kit` no los emite.
4. `docker exec quien-sabe-app bun run db:migrate:local`.
5. HUs 09.2-09.6 consumen vía Drizzle.

## Capa de servicios

Stub en `src/lib/services/reviews.ts` (referenciado por HU-07.1 y HU-07.4):
- `getProviderRatingStats(env, providerId): Promise<{ avg: number | null, count: number }>`.
- `listProviderReviews(env, providerId, opts): Promise<...>` (implementación completa en HU-07.4).

(Esta HU no implementa los servicios; sólo deja las firmas y deja el stub. Las HUs siguientes los completan.)

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/reviews/schema.test.ts` | Migración crea tablas; INSERT válido; CHECK de rating rechaza 0, 6, NULL, no-int; CHECK de status rechaza 'otro'; CHECK de body rechaza 1001 chars; UNIQUE(user_id, provider_id) rechaza duplicado; FK cascade borra reseñas al borrar provider |

## Dependencias y secuencia

- **Bloqueado por:** REQ-04 (`providers`), REQ-01 (`users`).
- **Bloquea a:** HU-09.2, HU-09.3, HU-09.4, HU-09.5, HU-09.6, HU-07.4 (que ya depende de esto).
- **Recursos compartidos:** binding D1, `src/database/schema.ts`.

## Riesgos tecnicos

- Riesgo: `drizzle-kit` no emite CHECKs automáticamente → Mitigación: editar la migración SQL manualmente y agregarlos (patrón establecido en HU-08.1).
- Riesgo: SQLite no enforza FK por defecto en D1 → Mitigación: verificar `PRAGMA foreign_keys = ON` en `src/database/client.ts` (HU-08.1 ya lo documentó).
- Riesgo: índice `(provider_id, status, created_at DESC, id DESC)` no se usa si SQLite lo reordena → Mitigación: `EXPLAIN QUERY PLAN` en test confirma uso; si no, ajustar nombres de columnas en el índice.
- Riesgo: reseñas muy largas en `body` llenan D1 → Mitigación: CHECK `length(body) <= 1000` aplica en DB; la validación Zod es redundante pero defendida en profundidad.
