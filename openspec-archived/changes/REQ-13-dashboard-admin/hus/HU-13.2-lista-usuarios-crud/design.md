# Diseno tecnico — HU-13.2 — Listado de usuarios con ban y cambio de rol

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

Lee/escribe sobre `users` (REQ-01). No introduce tablas nuevas. La auditoría la escribe `admin_audit_log` (HU-13.7).

```ts
// columnas relevantes (extracto, ya en src/database/schema.ts)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['vecino', 'prestador', 'admin'] }).notNull(),
  status: text('status', { enum: ['active', 'inactive', 'banned'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})
```

## Contrato de API

### `GET /api/v1/admin/users`

- **Auth:** admin (HU-13.1).
- **Query:**
  - `role?: 'vecino' | 'prestador' | 'admin'`
  - `status?: 'active' | 'inactive' | 'banned'`
  - `limit: number` (1..100, default 20)
  - `cursor?: string`
- **Response 200:**
  ```json
  {
    "items": [
      { "id": 12, "email": "juan@ejemplo.cl", "role": "prestador", "status": "active", "created_at": "..." }
    ],
    "next_cursor": "..."
  }
  ```
- Sort: `created_at DESC, id DESC`.

### `PATCH /api/v1/admin/users/:id`

- **Auth:** admin.
- **Body (cualquier subset):**
  ```json
  { "role": "admin", "status": "banned" }
  ```
- **Response 200:** `{ ok: true, user: { id, role, status } }`
- **Response 409** si `id === actor.id` y (`status === 'banned'` o `role !== 'admin'`):
  ```json
  { "error": "no puede banearse a sí mismo" }
  ```
- **Side effects:**
  - Si `status: 'banned'` → invalidar TODAS las sesiones del usuario en KV (loop sobre `session:<sessionId>`).
  - Si `role` cambia → `logAdminAction(...)`.

## Validaciones Zod

```ts
// src/lib/validators/admin-users.ts
import { z } from 'zod'

export const userRoleSchema = z.enum(['vecino', 'prestador', 'admin'])
export const userStatusSchema = z.enum(['active', 'inactive', 'banned'])

export const adminUsersListQuerySchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(200).optional(),
})

export const adminUserPatchSchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
}).refine((b) => b.role !== undefined || b.status !== undefined, {
  message: 'al menos un campo',
})
```

## Componentes UI

- `src/components/admin/UsersList.astro` — tabla con columnas (Email, Rol, Estado, Creado, Acciones). Filtros arriba (select rol, select status, botón "Aplicar").
- `src/components/admin/UserActions.astro` — fila de acciones por usuario: botón "Editar" (abre modal REQ-02 reutilizable), botón "Banear" / "Desbanear" según `status`.
- `src/components/admin/UserEditModal.astro` — modal con selects de rol y estado + confirmación antes de aplicar (alert inline: "¿Confirmas banear a juan@x?").

Estilo: replica `mockups/dashboard-admin.html:147-186` (tabla en card `bg-white rounded-3xl`, header `bg-gray-50`, filas con `hover:bg-gray-50`).

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin?section=users` → SSR llama `GET /api/v1/admin/users?limit=20`.
2. Backend ejecuta SQL con filtros opcionales (`WHERE role = ? AND status = ?` si vienen).
3. Admin cambia filtro "rol = prestador" → URL `?role=prestador&...` → SSR recarga.
4. Admin click "Banear" en fila de Juan → modal pide confirmación → submit.
5. Cliente `fetch('/api/v1/admin/users/<id>', { method: 'PATCH', body: { status: 'banned' } })`.
6. Server: valida Zod → chequea `actor.id !== target.id` → UPDATE `users.status = 'banned'` → loop `kv.delete('session:' + sid)` para cada sesión del usuario (lookup por índice `sessions:by_user:<id>`) → `logAdminAction(env, actor.id, 'update', 'users', id, before, after)` → 200.
7. Cliente cierra modal y recarga tabla.

## Capa de servicios

```ts
// src/lib/services/admin/users.ts (firmas)
export async function listAdminUsers(
  env: Env,
  filters: { role?: UserRole; status?: UserStatus; limit: number; cursor?: string },
): Promise<{ items: AdminUserRow[]; nextCursor: string | null }>

export async function patchAdminUser(
  env: Env,
  actorId: number,
  targetId: number,
  patch: { role?: UserRole; status?: UserStatus },
): Promise<{ ok: true; user: { id: number; role: UserRole; status: UserStatus } }>

export async function invalidateUserSessions(env: Env, userId: number): Promise<number>
// retorna cuántas sesiones se invalidaron
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-users/patch-schema.test.ts` | Body vacío → error; role inválido → error |
| Unit | `tests/unit/admin-users/self-ban.test.ts` | Helper que detecta self-ban → 409 |
| Integracion | `tests/integration/admin/users-list.test.ts` | Filtros role+status; paginación |
| Integracion | `tests/integration/admin/users-patch.test.ts` | Ban exitoso + sesiones invalidadas + audit log; self-ban → 409 |
| Integracion | `tests/integration/admin/users-crud-rbac.test.ts` | Vecino intentando PATCH → 403 (cubierto por HU-13.1 pero verificamos end-to-end) |
| E2E | `tests/e2e/admin-users-crud.spec.ts` | Admin banea → tabla refleja; login del baneado → 403 |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), REQ-01 (tabla users + KV sesiones), HU-13.7 (audit).
- **Bloquea a:** — (REQ-15 y REQ-18 lo consumen pero no requieren su API específica).
- **Recursos compartidos:** `src/lib/services/sessions/` (REQ-01), `admin_audit_log` (HU-13.7).

## Riesgos tecnicos

- Riesgo: invalidar 1000 sesiones de un usuario spameador con muchos dispositivos es lento → Mitigación: el loop sobre `sessions:by_user:<id>` itera como máximo las sesiones de los últimos 90 días; aceptable. Si se vuelve bottleneck, particionar por shard.
- Riesgo: race condition entre el check de sesión y el UPDATE → Mitigación: aceptable; en el peor caso el baneado hace una request más antes de ser bloqueado, y queda en audit log.
- Riesgo: el admin cambia su propio rol a `vecino` y queda locked-out → Mitigación: el check de auto-ban cubre cambios a roles no-admin y a status no-active; un admin que se degrada a vecino queda logged out al siguiente middleware hit, lo cual es el comportamiento correcto (él mismo lo pidió).
