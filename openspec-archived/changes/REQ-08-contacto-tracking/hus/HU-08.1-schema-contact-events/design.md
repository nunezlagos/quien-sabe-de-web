# Diseno tecnico — HU-08.1 — Schema contact_events con índices

**REQ padre:** REQ-08-contacto-tracking

## Modelo de datos

### Tablas Drizzle (pseudocodigo)

```ts
// src/database/schema.ts (extracto)
export const contactEvents = sqliteTable('contact_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['whatsapp', 'phone', 'email'] }).notNull(),
  ipHash: text('ip_hash').notNull(),   // SHA-256 hex, length 64
  uaHash: text('ua_hash').notNull(),   // SHA-256 hex, length 64
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  byProvider: index('idx_contact_events_provider').on(t.providerId),
  byProviderDate: index('idx_contact_events_provider_date')
    .on(t.providerId, t.createdAt),
  // CHECKs declarados en la migración SQL: kind IN (...), length(ip_hash)=64, length(ua_hash)=64
}))
```

### Migracion Drizzle

- Archivo objetivo: `src/database/migrations/00XX_contact_events.sql`
- Cambios:
  - `CREATE TABLE contact_events (...)` con `CHECK (kind IN ('whatsapp','phone','email'))`, `CHECK (length(ip_hash) = 64)`, `CHECK (length(ua_hash) = 64)`.
  - `CREATE INDEX idx_contact_events_provider ON contact_events(provider_id);`
  - `CREATE INDEX idx_contact_events_provider_date ON contact_events(provider_id, created_at DESC);`
  - Foreign key a `providers(id)` con `ON DELETE CASCADE`.

## Contrato de API

No aplica. HU 100% backend (DDL). Los endpoints que consultan esta tabla viven en HU-08.2, HU-08.4 y HU-08.5.

## Validaciones Zod

```ts
// src/lib/validators/contacts.ts (firmas, sin logica)
export const contactKindSchema = z.enum(['whatsapp', 'phone', 'email'])

export const contactEventInsertSchema = z.object({
  providerId: z.number().int().positive(),
  kind: contactKindSchema,
  ipHash: z.string().length(64).regex(/^[0-9a-f]+$/),
  uaHash: z.string().length(64).regex(/^[0-9a-f]+$/),
})
```

## Componentes UI

No aplica. Esta HU es backend puro (DDL + validador compartido).

## Flujo de interaccion (secuencial)

1. Se actualiza `src/database/schema.ts` agregando `contactEvents`.
2. Se ejecuta `docker exec quien-sabe-app bun run db:generate` para producir la migración.
3. Se aplica con `docker exec quien-sabe-app bun run db:migrate:local`.
4. Otras HUs (HU-08.2, HU-08.4, HU-08.5) consumen la tabla vía Drizzle.

## Capa de servicios

- `src/lib/services/contact-events.ts` — métodos (firmas en pseudocodigo):
  - `insertContactEvent(env, input: ContactEventInsert): Promise<void>` — usado por HU-08.2.
  - `countContactsByProvider(env, providerId, range): Promise<ProviderContactMetrics>` — usado por HU-08.4.
  - `countContactsGlobal(env, range): Promise<GlobalContactMetrics>` — usado por HU-08.5.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/contacts/schema.test.ts` | Insert válido, `CHECK` enum, longitud hash, FK cascade, índices presentes |

## Dependencias y secuencia

- **Bloqueado por:** REQ-07 (necesita tabla `providers` y migraciones previas).
- **Bloquea a:** HU-08.2, HU-08.4, HU-08.5.
- **Recursos compartidos:** binding D1 `Astro.locals.runtime.env.DB`, `src/database/schema.ts`.

## Riesgos tecnicos

- Riesgo: índices duplican costo de escritura → Mitigación: tabla append-only, el costo es aceptable.
- Riesgo: SQLite no enforza FK por defecto en D1 → Mitigación: verificar `PRAGMA foreign_keys = ON` en `src/database/client.ts`.
- Riesgo: rotación de salt produce inconsistencias en deduplicación por IP → Mitigación: documentar que las consultas de rate-limit usan ventana corta (1h) donde el salt no cambia.
