# Diseño técnico — HU-23.1 — Esquema portfolio_images con límite 5

**REQ padre:** REQ-23-portfolio-prestador

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const portfolioImages = sqliteTable('portfolio_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id').notNull().references(() => providers.id),
  r2Key: text('r2_key').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  uniqProviderOrder: uniqueIndex('uq_portfolio_provider_order').on(t.providerId, t.sortOrder),
  idxProvider: index('idx_portfolio_provider').on(t.providerId),
}))
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/NNNN_portfolio_images.sql`
- Cambios:
  - `CREATE TABLE portfolio_images`.
  - `CREATE UNIQUE INDEX uq_portfolio_provider_order`.
  - `CREATE INDEX idx_portfolio_provider`.
  - Seed opcional para entorno de tests reflejando `mockups/js/data.js:36-40`.

## Contrato de API

No expone endpoints propios. Es base para HU-23.2, HU-23.3, HU-23.4 y HU-23.5.

## Validaciones Zod

```ts
// src/lib/validators/portfolio.ts (pseudocódigo)
export const portfolioImageRowSchema // shape interno: { id, providerId, r2Key, sortOrder }
// La validación de capacidad vive en el servicio, no en Zod (no es validación de input externo).
```

## Componentes UI

No aplica. HU 100% schema/DB.

## Flujo de interacción

No aplica. Es soporte para el resto de HUs.

## Capa de servicios

- `src/lib/services/portfolio/limits.ts`
  - `assertPortfolioCapacity(db, providerId): Promise<void>` — lanza error tipado si la cuenta actual ≥ 5.
  - `nextSortOrder(db, providerId): Promise<number>` — devuelve max(sort_order)+1 ó 0 si no hay filas.
  - `compactSortOrder(db, providerId): Promise<void>` — recompacta filas restantes a 0..n-1 tras un DELETE.
- Estas firmas se reutilizan en HU-23.2 y HU-23.3.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/portfolio/limits.test.ts` | `assertPortfolioCapacity` lanza al 6º, `nextSortOrder` devuelve 0..4 en orden |
| Integración | `tests/integration/portfolio/schema.test.ts` | UNIQUE `(provider_id, sort_order)` rechaza duplicados, FK rechaza `provider_id` inexistente |

## Dependencias y secuencia

- **Bloqueado por:** REQ-04 (modelo de `providers`).
- **Bloquea a:** HU-23.2, HU-23.3, HU-23.4, HU-23.5.
- **Recursos compartidos:** binding D1 `Astro.locals.runtime.env.DB`.

## Riesgos técnicos

- Riesgo: SQLite no soporta `CHECK ((SELECT COUNT(*) ...) <= 5)` → mitigación: validación en `assertPortfolioCapacity` invocada en cada `INSERT` del servicio.
- Riesgo: borrar y reinsertar con mismo `sort_order` en la misma transacción puede colisionar con UNIQUE en algunos modos → mitigación: `compactSortOrder` reasigna primero a valores temporales o usa `UPDATE ... ORDER BY` decreciente.
