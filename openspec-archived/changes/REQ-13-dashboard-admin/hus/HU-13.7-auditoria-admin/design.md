# Diseno tecnico — HU-13.7 — Log de auditoría de acciones admin

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto)
export const adminAuditLog = sqliteTable('admin_audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorId: integer('actor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  action: text('action', { enum: ['create', 'update', 'delete', 'refund', 'view'] }).notNull(),
  entity: text('entity').notNull(), // 'users' | 'trades' | 'settings' | 'donations' | 'admin_audit_log'
  entityId: text('entity_id'), // string porque puede ser 'users/123' o 'settings/rate_limit_contact'
  beforeJson: text('before_json'), // null para create
  afterJson: text('after_json'),  // null para delete
  ipAddress: text('ip_address'), // opcional
  userAgent: text('user_agent'), // opcional
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byActor: index('idx_audit_actor').on(t.actorId),
  byEntity: index('idx_audit_entity').on(t.entity, t.entityId),
  byCreatedAt: index('idx_audit_created').on(t.createdAt),
}))
```

Nota: `entityId` como TEXT para soportar IDs compuestos (`settings/rate_limit_contact`) y evitar problemas de tipo entre tablas.

## Contrato de API

### `GET /api/v1/admin/audit-log`

- **Auth:** admin.
- **Query:**
  - `actor_id?: number`
  - `entity?: string`
  - `action?: 'create' | 'update' | 'delete' | 'refund' | 'view'`
  - `from?: string` (YYYY-MM-DD)
  - `to?: string` (YYYY-MM-DD)
  - `limit: number` (1..200, default 50)
  - `cursor?: string`
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": 987,
        "actor": { "id": 3, "email": "admin@ejemplo.cl" },
        "action": "update",
        "entity": "users",
        "entity_id": "12",
        "before": { "status": "active" },
        "after": { "status": "banned" },
        "ip_address": "192.0.2.1",
        "created_at": "2026-06-18T13:21:00Z"
      }
    ],
    "next_cursor": "..."
  }
  ```
- Sort: `created_at DESC, id DESC`.

## Validaciones Zod

```ts
// src/lib/validators/admin-audit-log.ts
import { z } from 'zod'

export const auditActionSchema = z.enum(['create', 'update', 'delete', 'refund', 'view'])

export const auditLogQuerySchema = z.object({
  actor_id: z.coerce.number().int().positive().optional(),
  entity: z.string().min(1).max(60).optional(),
  action: auditActionSchema.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().min(1).max(200).optional(),
}).refine((q) => !(q.from && q.to) || new Date(q.from) <= new Date(q.to), {
  message: 'from debe ser <= to',
})
```

## Componentes UI

- `src/components/admin/AuditLogPanel.astro` — tabla con columnas (Fecha, Actor, Acción, Entidad, ID). Filtros arriba (actor_id, entity, action, rango fechas).
- `src/components/admin/AuditLogRow.astro` — fila individual; click expande un `<details>` con JSON pretty-print de `before`/`after`.
- Helper `formatJSON(value): string` con indentación 2 espacios y truncado a 2KB en preview.

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin?section=audit-log` → SSR llama `GET /api/v1/admin/audit-log?limit=50`.
2. Servicio `listAuditLog(env, filters)`:
   - Construye query con `WHERE` dinámico según filtros.
   - Cursor = encode del último `created_at` + `id`.
3. Admin filtra por `entity=users` → URL `?entity=users` → SSR recarga.
4. Admin click fila → `<details>` se abre, muestra diff.

Cuando una HU admin (HU-13.2, 13.3, 13.6) ejecuta una mutación:

1. Mutación real (UPDATE/INSERT/DELETE) corre primero.
2. Helper `logAdminAction(env, ctx, action, entity, entityId, before, after)` inserta fila.
3. Si la mutación falla → NO se audita (no hay diff que reportar).

## Capa de servicios

```ts
// src/lib/services/audit/admin.ts (firmas)
export interface AuditContext {
  actorId: number
  ipAddress: string | null
  userAgent: string | null
}

export async function logAdminAction(
  env: Env,
  ctx: AuditContext,
  action: 'create' | 'update' | 'delete' | 'refund' | 'view',
  entity: string,
  entityId: string | number | null,
  before: unknown,
  after: unknown,
): Promise<void>

export interface AuditLogItem {
  id: number
  actor: { id: number; email: string }
  action: AuditAction
  entity: string
  entityId: string | null
  before: unknown
  after: unknown
  ipAddress: string | null
  createdAt: Date
}

export async function listAuditLog(
  env: Env,
  filters: AuditLogFilters,
): Promise<{ items: AuditLogItem[]; nextCursor: string | null }>
```

Reuso: `encodeCursor` / `decodeCursor` de `src/lib/utils/cursor.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-audit/logAdminAction.test.ts` | Snapshot before/after correcto; entityId null OK |
| Unit | `tests/unit/admin-audit/list-query-schema.test.ts` | from > to rechaza; filtros opcionales |
| Integracion | `tests/integration/admin/audit-log-insert.test.ts` | INSERT por cada tipo de action; FK a users |
| Integracion | `tests/integration/admin/audit-log-list.test.ts` | Filtros actor_id, entity, action; paginación 100 filas limit 20 |
| Integracion | `tests/integration/admin/audit-log-rbac.test.ts` | Vecino 403; sin sesión 401 |
| Integracion | `tests/integration/admin/audit-log-fk.test.ts` | ON DELETE RESTRICT (borrar user con audit log → falla) |
| E2E | `tests/e2e/admin-audit-log.spec.ts` | Admin ejecuta 3 acciones (ban, edit trade, change setting) → log muestra 3 filas con before/after correctos |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (el guard invoca `logAdminAction` para 'view'), REQ-01 (tabla users).
- **Bloquea a:** HU-13.2, HU-13.3, HU-13.6, HU-13.8 (todas llaman el helper), HU-13.1 (degrada sin tabla pero debe funcionar cuando esté).
- **Recursos compartidos:** binding D1, `src/lib/utils/cursor.ts`.

## Riesgos tecnicos

- Riesgo: la tabla crece 1 fila por cada admin write (y por cada 'view' si sampling=100) → Mitigación: archivado mensual (job futuro REQ-18); aceptable <10MB/año.
- Riesgo: snapshots JSON grandes (>10KB) hacen queries lentas → Mitigación: truncar before/after a 10KB en preview UI; el SELECT completo retorna el row completo pero la query principal no filtra por contenido.
- Riesgo: el helper se olvida de invocar desde una nueva HU admin → Mitigación: test E2E barre todos los endpoints admin y verifica que las mutaciones dejan fila en audit log.
