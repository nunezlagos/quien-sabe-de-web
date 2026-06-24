# Diseno tecnico — HU-05.1 — Schema services y service_coverage

**REQ padre:** REQ-05-catalogo-servicios

## Modelo de datos

### Tablas Drizzle (pseudocodigo)

```ts
// src/database/schema.ts (extracto)
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priceClp: integer('price_clp'),         // nullable: null = "Consultar"
  unit: text('unit', { enum: ['hora', 'visita', 'proyecto'] }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byProviderStatus: index('idx_services_provider_status').on(t.providerId, t.status),
  byProviderSort: index('idx_services_provider_sort').on(t.providerId, t.sortOrder),
}))

export const serviceCoverage = sqliteTable('service_coverage', {
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  communeId: integer('commune_id')
    .notNull()
    .references(() => communes.id, { onDelete: 'restrict' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.serviceId, t.communeId] }),
  byCommune: index('idx_service_coverage_commune').on(t.communeId),
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0004_services.sql`
- Cambios:
  - `CREATE TABLE services (...)` con `CHECK (price_clp IS NULL OR price_clp > 0)`.
  - `CREATE TABLE service_coverage (...)` con PK compuesta `(service_id, commune_id)`.
  - Foreign keys: `services.provider_id → providers(id) ON DELETE CASCADE`; `service_coverage.service_id → services(id) ON DELETE CASCADE`; `service_coverage.commune_id → communes(id) ON DELETE RESTRICT`.
  - Índices: `idx_services_provider_status`, `idx_services_provider_sort`, `idx_service_coverage_commune`.

## Contrato de API

No aplica. HU 100% backend (DDL). Los endpoints se entregan en HU-05.2
(CRUD), HU-05.3 (cobertura), HU-05.4 (reorder), HU-05.5 (toggle).

## Validaciones Zod

No aplica a nivel de DDL. Los schemas `ServiceCreate`, `ServicePatch`
se entregan en HU-05.2.

## Componentes UI

No aplica. La sección "Mis Servicios Activos" del dashboard del
prestador se renderiza desde `mockups/dashboard-provider.html:198-225`
y los componentes Astro correspondientes se entregan en HU-05.2 y
HU-12.

## Flujo de interaccion (secuencial)

1. Se actualiza `src/database/schema.ts` agregando `services` y `serviceCoverage`.
2. Se genera la migración con `docker exec quien-sabe-app bun run db:generate`.
3. Se aplica con `docker exec quien-sabe-app bun run db:migrate:local`.
4. HU-05.2, HU-05.3, HU-05.4 y HU-05.5 consumen vía Drizzle.

## Capa de servicios

Esta HU no agrega servicios nuevos. Los servicios `services.ts` y
`serviceCoverage.ts` se crean en HU-05.2 y HU-05.3 respectivamente.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/services/schema.test.ts` | CREATE TABLE; CHECK `price_clp > 0`; FK a providers; cascade desde providers elimina services + coverage |
| Integracion | `tests/integration/services/schema-cascade.test.ts` | Eliminar provider físicamente → services y service_coverage de ese provider desaparecen; eliminar commune con services asociados → falla por FK RESTRICT |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (`providers`), REQ-02 (`communes`).
- **Bloquea a:** HU-05.2, HU-05.3, HU-05.4, HU-05.5; HU-06.x (búsqueda).
- **Recursos compartidos:** `src/database/schema.ts`, binding D1.

## Riesgos tecnicos

- Riesgo: `CHECK (price_clp IS NULL OR price_clp > 0)` puede no funcionar en todas las versiones de SQLite/D1 → Mitigación: validar también en Zod (HU-05.2) antes de llegar a la tabla; test de integración verifica ambos lados.
- Riesgo: doble cascade (services ← providers y service_coverage ← services) genera delete en orden inesperado → Mitigación: SQLite resuelve cascade en orden de FK declarada; verificar con test que elimina un provider con cobertura y cuenta filas antes/después.
- Riesgo: índice `(provider_id, status)` no se usa si la query agrega `LIMIT` sin WHERE → Mitigación: documentar el patrón de query esperado para REQ-06.
