# Diseño técnico — HU-24.1 — Esquema provider_availability

**REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Modelo de datos

### Nueva tabla Drizzle

```ts
// src/database/schema.ts
export const providerAvailability = sqliteTable('provider_availability', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),  // 0 = domingo, 6 = sábado
  startTime: text('start_time').notNull(),       // 'HH:MM'
  endTime: text('end_time').notNull(),           // 'HH:MM'
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  uniqueSlot: uniqueIndex('idx_provider_availability_unique').on(t.providerId, t.dayOfWeek, t.startTime),
  byProvider: index('idx_provider_availability_provider').on(t.providerId),
  // CHECK end_time > start_time se declara en la migración SQL
}))
```

### Migración Drizzle

`src/database/migrations/00XX_provider_availability.sql`:
- `CREATE TABLE provider_availability (...)` con PK auto-increment.
- `CHECK (day_of_week BETWEEN 0 AND 6)`.
- `CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]')`.
- `CHECK (end_time GLOB '[0-2][0-9]:[0-5][0-9]')`.
- `CHECK (end_time > start_time)`.
- `CREATE UNIQUE INDEX idx_provider_availability_unique ON provider_availability(provider_id, day_of_week, start_time)`.
- `CREATE INDEX idx_provider_availability_provider ON provider_availability(provider_id)`.
- Foreign key a `providers(id)` con `ON DELETE CASCADE`.

## Contrato de API

No aplica. Esta HU es DDL puro. Los endpoints CRUD viven en HU-24.2.

## Validaciones Zod

```ts
// src/lib/validators/availability.ts
const HHMM = /^(?:2[0-3]|[01]\d):[0-5]\d$/

export const availabilityRangeSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(HHMM, 'Formato HH:MM requerido'),
  end_time: z.string().regex(HHMM, 'Formato HH:MM requerido'),
}).refine(
  (data) => data.end_time > data.start_time,
  { message: 'end_time debe ser mayor que start_time', path: ['end_time'] }
)

export const availabilityArraySchema = z.array(availabilityRangeSchema).max(50)  // tope defensivo
```

## Componentes UI

No aplica. Esta HU es backend puro.

## Flujo de interacción (secuencial)

1. Se actualiza `src/database/schema.ts` agregando `providerAvailability`.
2. Se ejecuta `docker exec quien-sabe-app bun run db:generate` para producir la migración.
3. Se aplica con `docker exec quien-sabe-app bun run db:migrate:local`.
4. Otras HUs (HU-24.2 CRUD, HU-24.3 badge, HU-24.4 filtro, HU-24.5 toggle) consumen la tabla vía Drizzle.

## Capa de servicios

Esta HU no introduce servicios. HU-24.2 introduce `src/lib/services/availability/crud.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/availability/schema.test.ts` — INSERT válido; CHECK `end_time > start_time` rechaza; UNIQUE `(provider_id, day_of_week, start_time)` rechaza duplicado; múltiples rangos por día coexisten; FK cascade borra al borrar provider; índices presentes (`EXPLAIN QUERY PLAN`). |
| Unit | `tests/unit/validators/availability.test.ts` — `availabilityRangeSchema` acepta `{day:1, start:'09:00', end:'13:00'}`; rechaza `end < start`; rechaza `'24:00'`; rechaza `'9:00'` (sin zero pad); rechaza `day: 7`; acepta array de hasta 50 elementos. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-04 (tabla `providers`).
- **Bloquea a:** HU-24.2 (CRUD), HU-24.3 (cálculo `isAvailableNow`), HU-24.4 (filtro search), HU-24.5 (toggle).
- **Recursos compartidos:** `src/database/schema.ts`, D1 binding.

## Riesgos técnicos

- Riesgo: `day_of_week` con convención 0=domingo difiere de algunas libs JS (que usan 0=lunes) → Mitigación: documentar explícitamente en `schema.ts` con comentario `// 0 = domingo, 6 = sábado`; helper `jsDayToSql()` y `sqlDayToJs()` en `src/lib/services/availability/dates.ts`.
- Riesgo: la regex `[0-2][0-9]:[0-5][0-9]` permite `24:00` y `29:99` → Mitigación: la regex fina en Zod `(?:2[0-3]|[01]\d):[0-5]\d` es la real; la del CHECK es defensa base.
- Riesgo: migración falla si la tabla `providers` no existe → Mitigación: verificar orden de migraciones; si REQ-04 no aplicó, abortar con mensaje claro.