# Diseño técnico — HU-28.4 — Schema user_views + sección Recientes

**REQ padre:** REQ-28-actividad-vecino-favoritos

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const userViews = sqliteTable('user_views', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  viewType: text('view_type', { enum: ['profile', 'search'] })
    .notNull()
    .default('profile'),
  viewedAt: integer('viewed_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => ({
  idxUserViewedAt: index('idx_user_views_user_viewed')
    .on(t.userId, t.viewedAt.desc()),
}))
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/NNNN_user_views.sql`
- Cambios:
  - `CREATE TABLE user_views` con PK `id` autogenerado.
  - Índice `idx_user_views_user_viewed (user_id, viewed_at DESC)`.
  - FK a `users` con cascade, FK a `providers` con cascade.
  - Columna `view_type` con enum `'profile' | 'search'` (reserva para
    futuras búsquedas guardadas).

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/:id/views` | POST | sesión vecino | (vacío) | `{ recorded: boolean }` | 401 sin sesión, 404 provider inexistente, 410 provider soft-deleted |
| `/api/v1/users/me/views` | GET | sesión vecino | query `limit` (1-50, default 5) | `{ views: ViewItem[] }` | 401 sin sesión |

Forma de `ViewItem`:

| Campo | Tipo | Origen |
|---|---|---|
| `view_id` | string | `user_views.id` |
| `provider_id` | string | `user_views.provider_id` |
| `slug` | string | `providers.slug` |
| `label` | string | `"Perfil de " + providers.display_name` |
| `icon_class` | string | `ri-user-line` si `view_type=profile`, `ri-search-line` si `search` |
| `viewed_at` | string (ISO) | `user_views.viewed_at` |

Comportamiento de dedupe del POST:

1. Si KV tiene `view_dedupe:<userId>:<providerId>` → `{ recorded: false }`, no inserta.
2. Si no, inserta fila y set KV con TTL 3600 s → `{ recorded: true }`.

## Validaciones Zod

```ts
// src/lib/validators/views.ts (pseudocódigo)
export const providerIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const listViewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/p/[slug].astro` — añade side-effect SSR: tras resolver el
  provider, si hay sesión vecino y `session.user_id !== provider.user_id`,
  invoca `recordView(userId, providerId)`. Mockup base:
  `mockups/profile.html:60-104` (no cambia el render visual).
- `src/pages/dashboard-user.astro` — la sección "Recientes" se reemplaza
  por `<RecentViews items={views} />`. Mockup base:
  `mockups/dashboard-user.html:100-112`.

### Componentes Astro reutilizables

- `src/components/activity/RecentViews.astro` — props:
  - `items: ViewItem[]`
- Mockup base: `mockups/dashboard-user.html:100-112`. Conserva el
  contenedor `bg-white rounded-3xl shadow-sm border border-gray-100 p-6`,
  el header `ri-history-line text-gray-400`, y la lista `<ul class="space-y-3">`.
- Islas requeridas: no. Render 100 % SSR; cada `<li>` envuelve un
  `<a href={slug}>` para reabrir el perfil.

- `src/components/activity/RecentViewsEmpty.astro` — estado vacío "Sin
  actividad reciente". UI a diseñar siguiendo el estilo del card padre
  (`mockups/dashboard-user.html:100`).

## Flujo de interacción (secuencial)

1. Vecino logueado navega a `/p/juan-perez-gasfiter`.
2. SSR resuelve el provider y llama a `recordView(userId, providerId)`.
3. `recordView` consulta KV `SESSION` con clave
   `view_dedupe:<userId>:<providerId>`.
4. Si la clave existe → no-op silencioso.
5. Si no existe → `INSERT INTO user_views`, set KV con TTL 3600 s.
6. La página renderiza normal (`mockups/profile.html:60-104`).
7. Vecino navega a `/dashboard-user`. SSR consulta `listViews(userId,
   limit=5)` y renderiza `<RecentViews items={views} />` con el HTML
   del mockup `mockups/dashboard-user.html:100-112`.

## Capa de servicios

- `src/lib/services/activity/views.ts` (nuevo):
  - `recordView(env, userId: string, providerId: string, type?: 'profile' | 'search'): Promise<{ recorded: boolean }>`
    — implementa dedupe vía `env.SESSION` KV + insert en D1.
  - `listViews(db, userId: string, limit?: number): Promise<ViewItem[]>`
    — join con `providers`, filtra `deleted_at IS NULL`, orden
    `viewed_at DESC`, default limit = 5.
  - `trimUserViews(db, userId: string, keep: number = 50): Promise<number>`
    — borra filas excedentes; devuelve cuántas eliminó.
  - `trimAllUserViews(db, keep: number = 50): Promise<{ usersProcessed: number; rowsDeleted: number }>`
    — versión batch para el cron.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/views/dedupe.test.ts` | Dedupe vía KV mock < 1h |
| Unit | `tests/unit/views/trim.test.ts` | `trimUserViews` mantiene top 50 |
| Integración | `tests/integration/views/record-and-list.test.ts` | POST + GET contra D1 + KV reales |
| Integración | `tests/integration/views/self-view-skip.test.ts` | Provider visitando su propio perfil no registra |
| E2E | `tests/e2e/recent-views.spec.ts` | Vecino visita perfil → aparece en dashboard |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (users), REQ-04 (providers), REQ-07
  (binding `SESSION` KV).
- **Bloquea a:** ninguna en este REQ.
- **Recursos compartidos:** `src/database/schema.ts`,
  `src/pages/p/[slug].astro`, `src/pages/dashboard-user.astro`,
  binding KV `SESSION`, Cloudflare Cron Trigger.

## Riesgos técnicos

- Riesgo: cron mensual no configurado → Mitigación: documentar en
  REQ-26.5 o agregar trigger en `wrangler.toml` con expresión
  `0 3 1 * *`; sin cron, el peor caso es tabla creciente pero el GET
  siempre limita a 5.
- Riesgo: side-effect SSR de POST bloquea el render → Mitigación:
  ejecutar `recordView` con `Astro.locals.runtime.ctx.waitUntil(...)`
  para no bloquear la respuesta al cliente.
- Riesgo: provider soft-deleted aparece en "Recientes" → Mitigación:
  `listViews` filtra `providers.deleted_at IS NULL` en el join.
- Riesgo: KV eventualmente consistente registra dos veces seguidas →
  Mitigación: aceptable; el TRIM mensual y el `limit=5` del GET ocultan
  el ruido.
