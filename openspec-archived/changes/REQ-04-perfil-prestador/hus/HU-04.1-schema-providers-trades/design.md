# Diseno tecnico — HU-04.1 — Schema providers + trades con seed

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

### Tablas Drizzle (pseudocodigo)

```ts
// src/database/schema.ts (extracto)
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  bySlug: uniqueIndex('idx_trades_slug').on(t.slug),
}))

export const providers = sqliteTable('providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  tradeId: integer('trade_id')
    .notNull()
    .references(() => trades.id, { onDelete: 'restrict' }),
  communeId: integer('commune_id')
    .notNull()
    .references(() => communes.id, { onDelete: 'restrict' }),
  description: text('description').notNull().default(''),
  photoR2Key: text('photo_r2_key'),
  coverR2Key: text('cover_r2_key'),          // agregado en HU-04.6 via ALTER
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  emailPublic: text('email_public'),
  hourlyRateClp: integer('hourly_rate_clp'),
  slug: text('slug').notNull().unique(),
  status: text('status', { enum: ['draft', 'published', 'deleted'] })
    .notNull()
    .default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  byUser: uniqueIndex('idx_providers_user').on(t.userId),
  bySlug: uniqueIndex('idx_providers_slug').on(t.slug),
  byTradeCommune: index('idx_providers_trade_commune').on(t.tradeId, t.communeId),
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0002_providers_trades.sql`
- Cambios:
  - `CREATE TABLE trades (... UNIQUE(slug))`
  - `CREATE TABLE providers (... UNIQUE(user_id), UNIQUE(slug), FK a users/trades/communes)`
  - `INSERT OR IGNORE INTO trades (slug, name) VALUES ('gasfiter','Gasfíter'), ('electricista','Electricista'), ('jardinero','Jardinero'), ('gasista','Gasista'), ('pintor','Pintor');`

## Contrato de API

No aplica. HU 100% backend (DDL). Los endpoints que consultan estas
tablas viven en HU-04.2 (CRUD), HU-06.1 (search) y HU-07.1 (perfil
público).

## Validaciones Zod

No aplica a nivel de DDL. Los Zod schemas de `ProviderCreate` y
`ProviderPatch` se definen en HU-04.2.

## Componentes UI

No aplica. Esta HU es backend puro (DDL + seed). Los componentes que
leen `trades` se maquetan en HU-04.2 (form de perfil) y HU-06.4
(autocomplete del buscador).

## Flujo de interaccion (secuencial)

1. Se actualiza `src/database/schema.ts` agregando `trades` y `providers`.
2. Se ejecuta `docker exec quien-sabe-app bun run db:generate` para producir la migración.
3. Se aplica con `docker exec quien-sabe-app bun run db:migrate:local`.
4. Otras HUs (HU-04.2 CRUD, HU-06.1 search, HU-07 perfil público) consumen vía Drizzle.

## Capa de servicios

- `src/lib/services/trades.ts` — `listTrades(db): Promise<Trade[]>` (HU-06.4).
- `src/lib/services/providers.ts` — scaffolding mínimo de cara a HU-04.2; acá sólo se define el type `Provider` derivado del schema.
- `src/lib/utils/slug.ts` — `generateProviderSlug(name, commune, suffix?)` (HU-04.2).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/providers/schema.test.ts` | FK a users/trades/communes, `UNIQUE(user_id)`, `UNIQUE(slug)`, `CHECK` no necesario en esta HU |
| Integracion | `tests/integration/trades/seed.test.ts` | Seed idempotente: `seedTrades(db)` 2 veces → 5 oficios, no 10 |
| Unit | `tests/unit/utils/slug.test.ts` | `generateProviderSlug` kebab-case + sufijo aleatorio cuando hay colisión |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (`users`), REQ-02 (`communes`).
- **Bloquea a:** HU-04.2 (CRUD), HU-04.3 (foto), HU-04.5 (reindex), HU-05.x (servicios), HU-06.x (búsqueda), HU-07 (perfil público), HU-12 (dashboard prestador).
- **Recursos compartidos:** `src/database/schema.ts`, binding D1.

## Riesgos tecnicos

- Riesgo: D1 no enforza FK por defecto → Mitigación: `PRAGMA foreign_keys = ON` en `src/database/client.ts`, verificado por test `tests/integration/db/fk.test.ts` previo a esta HU.
- Riesgo: seed se vuelve divergente entre entornos → Mitigación: migración `0002_providers_trades.sql` con `INSERT OR IGNORE` (idempotente).
- Riesgo: columna `cover_r2_key` agregada en HU-04.6 vía `ALTER TABLE` puede romper esta migración si se reordena → Mitigación: la columna se declara ya en el schema (nullable) para evitar dos migraciones separadas; la constraint específica de cover vive en HU-04.6.
