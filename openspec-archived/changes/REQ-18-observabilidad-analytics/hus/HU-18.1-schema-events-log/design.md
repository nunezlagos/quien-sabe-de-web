# Diseño técnico — HU-18.1 — Schema events_log con índices

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const eventsLog = sqliteTable('events_log', {
  id: text('id').primaryKey(),                // ULID/UUID generado en handler
  event: text('event').notNull(),             // CHECK enum (ver migración)
  actorRole: text('actor_role').notNull(),    // 'anonymous' | 'user' | 'provider' | 'admin'
  propsJson: text('props_json').notNull(),    // TEXT validado por json_valid()
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  byEvent: index('idx_events_log_event').on(t.event),
  byEventCreatedDesc: index('idx_events_log_event_created_desc').on(t.event, t.createdAt),
}))
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/00XX_events_log.sql`
- Cambios:
  - `CREATE TABLE events_log` con columnas listadas.
  - `CHECK (event IN ('signup','search','contact','review','donation','ticket_open'))`.
  - `CHECK (json_valid(props_json))`.
  - `CHECK (actor_role IN ('anonymous','user','provider','admin'))`.
  - `CREATE INDEX idx_events_log_event ON events_log(event)`.
  - `CREATE INDEX idx_events_log_event_created_desc ON events_log(event, created_at DESC)`.

## Contrato de API

HU 100% capa de datos. No expone endpoints. Endpoints consumidores definidos en HU-18.3, HU-18.5, HU-18.6.

## Validaciones Zod

No aplica en esta HU (la validación ocurre en HU-18.3 antes del insert). El CHECK SQL actúa como red de seguridad última.

## Componentes UI

HU 100% backend. Sin componentes UI.

## Flujo de interacción (secuencial)

1. Desarrollador modifica `src/database/schema.ts` añadiendo `eventsLog`.
2. Ejecuta `docker exec quien-sabe-app bun run db:generate`.
3. Ejecuta `docker exec quien-sabe-app bun run db:migrate:local`.
4. Tests de integración validan la tabla contra D1 local.

## Capa de servicios

No se introduce servicio nuevo en esta HU. Las inserciones se hacen desde `src/pages/api/v1/events/track.ts` (HU-18.3) usando el cliente Drizzle existente en `src/database/client.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/events/schema.test.ts` | Tabla creada, índices presentes (`sqlite_master`), CHECK enum rechaza valor inválido, `json_valid` rechaza string no-JSON, inserción válida funciona. |

## Dependencias y secuencia

- **Bloqueado por:** ninguna (raíz del REQ).
- **Bloquea a:** HU-18.3 (insert), HU-18.4 (doble emisión necesita la tabla destino), HU-18.5 (KPIs), HU-18.6 (listado).
- **Recursos compartidos:** `src/database/schema.ts`, `src/database/migrations/`, binding `DB` de Cloudflare.

## Riesgos técnicos

- Renombrar o cambiar columnas tras adopción es costoso → fijar nombres definitivos antes del primer merge.
- Índice `(event, created_at desc)` agrega costo de escritura → aceptable vs el costo de lectura del dashboard.
- D1 no soporta `CHECK (json_valid(...))` en todas las versiones → verificar en el primer `db:migrate:local`; si no aplica, mantener solo CHECK de enum y delegar validación JSON al endpoint.
