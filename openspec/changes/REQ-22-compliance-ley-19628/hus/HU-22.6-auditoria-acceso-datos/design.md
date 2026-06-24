# Diseño técnico — HU-22.6 — Auditoría de acceso admin a datos personales

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

### Nueva tabla Drizzle

```ts
// src/database/schema.ts
export const dataAccessLog = sqliteTable('data_access_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: integer('admin_id').references(() => users.id, { onDelete: 'set null' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action', { enum: ['view_profile', 'view_raw_docs', 'edit_user', 'data_export', 'delete_user'] }).notNull(),
  accessedAt: integer('accessed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  reason: text('reason'),
  ipHash: text('ip_hash'),  // SHA-256 del IP del admin que accedió
}, (t) => ({
  byUser: index('idx_data_access_log_user').on(t.userId, t.accessedAt),
  byAdmin: index('idx_data_access_log_admin').on(t.adminId, t.accessedAt),
}))
```

Índice principal `(user_id, accessed_at DESC)` para que el titular consulte sus últimos accesos eficientemente.

### Migración
- `src/database/migrations/00XX_data_access_log.sql` con `CREATE TABLE` e índices.

## Contrato de API

| Endpoint | Método | Auth | Request | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/users/:id` | GET | sesión admin | — | datos del user | 401, 403 |
| `/api/v1/admin/users/:id/raw-docs` | GET | sesión admin | header `X-Access-Reason: string` (no vacío) | docs | 400 (reason vacío), 401, 403 |
| `/api/v1/users/me/access-log` | GET | sesión | — | `[{ admin_display_name, action, accessed_at, reason }]` | 401 |

## Validaciones Zod

```ts
// src/lib/validators/compliance/audit.ts
export const accessReasonSchema = z.string().trim().min(1).max(500)
```

```ts
// Header validator en middleware
const reason = request.headers.get('X-Access-Reason')
if (!reason || accessReasonSchema.safeParse(reason).success === false) {
  return new Response(JSON.stringify({ error: 'X-Access-Reason required' }), { status: 400 })
}
```

## Componentes UI

### Vista admin
- `src/pages/dashboard-admin/audit.astro` — tabla paginada con los últimos accesos:
  - Columnas: Fecha, Admin (display_name), User (id), Acción, Motivo.
  - Estilo: misma tabla de `mockups/dashboard-admin.html` (filas `border-b border-gray-100 hover:bg-gray-50`).
  - Paginación: query `LIMIT 50 OFFSET ?` con botones "Anterior" / "Siguiente".

### Middleware
- `src/lib/middleware/audit.ts`:
  - `auditAdminAccess(action)` — función que retorna un handler middleware.
  - Inserta fila en `data_access_log` con `adminId = session.userId`, `userId = <target>`, `action`, `reason` (si fue provisto), `ipHash`.
  - Si la ruta requiere reason, lee `X-Access-Reason` y rechaza 400 si falta.

### Aplicación
- En `src/middleware.ts` (Astro global) o en cada endpoint:
  ```ts
  // src/pages/api/v1/admin/users/[id]/index.ts
  export const GET: APIRoute = withAuth(['admin'], async ({ params, locals, request }) => {
    await auditAdminAccess('view_profile')(request, locals, params.id)
    return getUserById(env, params.id)
  })
  ```

## Flujo de interacción (secuencial)

### Caso: admin consulta perfil
1. Admin hace `GET /api/v1/admin/users/42`.
2. Middleware `requireRole('admin')` valida sesión.
3. Middleware `auditAdminAccess('view_profile')` inserta fila asíncrona en `data_access_log`.
4. Handler responde con datos del user 42.

### Caso: admin consulta datos sensibles
1. Admin hace `GET /api/v1/admin/users/42/raw-docs` con `X-Access-Reason: "Fiscalización AGPD"`.
2. Middleware `requireRole('admin')` valida sesión.
3. Middleware `auditAdminAccess('view_raw_docs')` valida header y rechaza 400 si falta.
4. Inserta fila con `reason="Fiscalización AGPD"`.
5. Handler responde con docs.

### Caso: titular consulta su log
1. User 42 hace `GET /api/v1/users/me/access-log`.
2. `requireSession` valida sesión.
3. Query: `SELECT dal.*, u.display_name as admin_display_name FROM data_access_log dal LEFT JOIN users u ON u.id = dal.admin_id WHERE dal.user_id = ? ORDER BY accessed_at DESC LIMIT 50`.
4. Responde 200 con array.

## Capa de servicios

- `src/lib/services/compliance/audit.ts`:
  - `recordAccess(env, adminId, userId, action, reason?, ip?)` — INSERT async.
  - `getUserAccessLog(env, userId, limit, offset)` — query paginada.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/audit.test.ts` — `accessReasonSchema` rechaza string vacío, whitespace-only, > 500 chars; acepta `"Fiscalización AGPD"`. |
| Integración | `tests/integration/compliance/access-log.test.ts` — admin GET `/admin/users/42` → fila en log con action='view_profile'; admin GET `/admin/users/42/raw-docs` sin header → 400; con header válido → 200 + fila con reason; user 42 GET `/users/me/access-log` → 2 filas (los 2 accesos admin) ordenadas DESC. |
| E2E | `tests/e2e/admin-audit.spec.ts` (opcional) — login admin → /dashboard-admin/audit → ve tabla con accesos; login user → /dashboard-user → sección "Mis accesos" → ve quién vio sus datos. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión), REQ-13 (dashboard admin renderiza tabla).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `src/lib/middleware/`, `src/database/schema.ts`.

## Riesgos técnicos

- Riesgo: el insert async puede fallar silenciosamente → Mitigación: try/catch en `recordAccess` con `console.error`; dashboard admin muestra alerta si los últimos N inserts fallaron (futuro).
- Riesgo: la query `getUserAccessLog` con LEFT JOIN puede ser lenta con miles de filas → Mitigación: índice `(user_id, accessed_at DESC)` ya cubre el ORDER BY. Si supera 100k filas, agregar paginación cursor-based.
- Riesgo: `X-Access-Reason` queda en logs del proxy → Mitigación: documentar que el admin no debe poner PII del titular en el motivo; el backend loguea solo `action` y `user_id`.