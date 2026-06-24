# Diseno tecnico — HU-13.3 — CRUD de oficios (trades) con reorder

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

### Migracion aditiva

```sql
-- src/database/migrations/00XX_trades_sort_order.sql
ALTER TABLE trades ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_trades_sort_order ON trades(sort_order);
```

### Drizzle

```ts
// src/database/schema.ts (extracto)
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'hogar' | 'tecnologia' | 'automotriz' | 'educacion' | 'salud_belleza' | 'otros'
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0), // NUEVO
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  bySlug: uniqueIndex('uq_trades_slug').on(t.slug),
  bySort: index('idx_trades_sort_order').on(t.sortOrder),
}))
```

Backfill: `UPDATE trades SET sort_order = id * 1000` (orden estable por id, espaciado para inserciones intermedias sin reordenar masivamente).

## Contrato de API

### `GET /api/v1/admin/trades`
- Response: `{ items: Trade[] }` ordenados por `sort_order ASC, id ASC`.

### `POST /api/v1/admin/trades`
- Body: `{ name: string, slug: string, category: string, description?: string }`
- Response 201: `{ ok: true, trade: Trade }`
- 409 si `slug` ya existe.

### `PATCH /api/v1/admin/trades/:id`
- Body: `{ name?: string, category?: string, description?: string, isActive?: boolean }` — **NUNCA** `slug` ni `sortOrder`.
- Response 200: `{ ok: true, trade: Trade }`

### `DELETE /api/v1/admin/trades/:id`
- 204 si éxito.
- 409 si oficio en uso: `SELECT 1 FROM provider_trades WHERE trade_id = ? LIMIT 1` retorna fila.

### `POST /api/v1/admin/trades/reorder`
- Body: `{ order: number[] }` (array completo de IDs en el orden deseado).
- Ejecuta UPDATE en batch (transacción) seteando `sort_order = index * 1000` para cada id.
- Response 200: `{ ok: true }`.

## Validaciones Zod

```ts
// src/lib/validators/admin-trades.ts
import { z } from 'zod'

export const tradeCategorySchema = z.enum(['hogar', 'tecnologia', 'automotriz', 'educacion', 'salud_belleza', 'otros'])

export const tradeCreateSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  category: tradeCategorySchema,
  description: z.string().max(280).optional(),
})

export const tradePatchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  category: tradeCategorySchema.optional(),
  description: z.string().max(280).optional(),
  isActive: z.boolean().optional(),
}).refine((b) => Object.keys(b).length > 0, { message: 'al menos un campo' })

export const tradeReorderSchema = z.object({
  order: z.array(z.number().int().positive()).min(1).max(500),
})
```

## Componentes UI

- `src/components/admin/TradesManager.astro` — tabla con handles de drag (`ri-drag-move-line`), columnas (Nombre, Categoría, Activo, Orden). Botón "Nuevo Oficio".
- SortableJS vía `<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js">` (CDN, ya usado en otros lados del proyecto) o import npm según convención (verificar `package.json`).
- `src/components/admin/TradeModal.astro` — modal para crear/editar oficio (replica del modal en `mockups/dashboard-admin.html:344-386`).
- `src/components/admin/TradeRow.astro` — fila con handle drag + acciones.

Estilo visual: replica `mockups/dashboard-admin.html:189-265`.

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin?section=trades` → SSR llama `GET /api/v1/admin/trades`.
2. Admin drag & drop filas → SortableJS detecta cambio de orden → al final del drag, dispara `POST /reorder` con array de IDs.
3. Server actualiza `sort_order` en transacción → 200.
4. Admin click "Nuevo Oficio" → modal → submit → `POST /trades` → 201 → modal cierra, tabla recarga.
5. Admin click "Editar" en fila → modal prellenado → submit → `PATCH /trades/<id>` → 200 → modal cierra.
6. Admin click "Eliminar" en oficio sin uso → confirm → `DELETE /trades/<id>` → 204 → fila desaparece.
7. Admin click "Eliminar" en oficio en uso → 409 → toast inline "oficio en uso por N prestadores".

## Capa de servicios

```ts
// src/lib/services/admin/trades.ts (firmas)
export async function listTradesForAdmin(env: Env): Promise<Trade[]>

export async function createTrade(env: Env, input: TradeCreate): Promise<Trade>
// throws: SlugConflictError (mapea a 409)

export async function patchTrade(env: Env, id: number, patch: TradePatch): Promise<Trade>

export async function deleteTrade(env: Env, id: number): Promise<void>
// throws: TradeInUseError (mapea a 409)

export async function reorderTrades(env: Env, orderedIds: number[]): Promise<void>
// ejecuta en batch UPDATE
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-trades/create-schema.test.ts` | slug duplicado, slug con mayúsculas, category inválida |
| Unit | `tests/unit/admin-trades/patch-schema.test.ts` | body vacío rechaza; slug en body ignorado |
| Integracion | `tests/integration/admin/trades-create.test.ts` | Create OK + 201; slug duplicado 409 |
| Integracion | `tests/integration/admin/trades-delete.test.ts` | Delete sin uso 204; en uso 409 |
| Integracion | `tests/integration/admin/trades-reorder.test.ts` | Reorder OK + persistencia + audit log |
| E2E | `tests/e2e/admin-trades.spec.ts` | Crear, editar (sin cambiar slug), reordenar con drag, intentar eliminar en uso |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), REQ-02 (tabla `trades` base), HU-13.7 (audit).
- **Bloquea a:** REQ-05 (catálogo público de oficios lee de `trades`; si la taxonomía está mal curada, el buscador se afecta).
- **Recursos compartidos:** `trades`, `provider_trades` (REQ-02).

## Riesgos tecnicos

- Riesgo: drag & drop con 200 oficios envía `reorder` con 200 IDs y la transacción es lenta → Mitigación: `sort_order = index * 1000` permite inserciones intermedias sin re-shuffle total; aceptable.
- Riesgo: el slug se intenta cambiar vía PATCH (slip del dev) → Mitigación: `tradePatchSchema` rechaza keys extra con `z.object(...).strict()`.
- Riesgo: SortableJS no carga en SSR (sólo cliente) → Mitigación: el `<script>` va con `is:inline` o en `<script type="module">`; fallback a botones "↑ ↓" si JS falla (a11y).
