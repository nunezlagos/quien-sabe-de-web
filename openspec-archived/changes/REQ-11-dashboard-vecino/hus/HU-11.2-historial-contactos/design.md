# Diseno tecnico — HU-11.2 — Historial de contactos del vecino

**REQ padre:** REQ-11-dashboard-vecino

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto)
export const contactEvents = sqliteTable('contact_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // NUEVO, nullable
  kind: text('kind', { enum: ['whatsapp', 'phone', 'email'] }).notNull(),
  ipHash: text('ip_hash').notNull(),
  uaHash: text('ua_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byProvider: index('idx_contact_events_provider').on(t.providerId),
  byProviderDate: index('idx_contact_events_provider_date').on(t.providerId, t.createdAt),
  byUserDate: index('idx_contact_events_user_date').on(t.userId, t.createdAt), // NUEVO
  // CHECKs en SQL: kind IN (...), length(ip_hash)=64, length(ua_hash)=64
}))
```

Cambios en migración SQL:
- `ALTER TABLE contact_events ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`
- `CREATE INDEX idx_contact_events_user_date ON contact_events(user_id, created_at DESC);`

El backfill no es necesario: filas existentes quedan con `user_id = NULL`, lo que es semánticamente correcto (fueron contactos anónimos).

## Contrato de API

### `GET /api/v1/users/me/contacts`

- **Auth:** sesión de vecino requerida (`Astro.locals.user.role === 'vecino'`).
- **Query params:**
  - `limit` (int, 1..50, default 20)
  - `cursor` (opcional, base64 del `created_at` + `id` del último item)
- **Response 200:**

```json
{
  "items": [
    {
      "id": 123,
      "kind": "whatsapp",
      "created_at": "2026-06-15T13:21:00Z",
      "provider": {
        "slug": "juan-perez",
        "name": "Juan Pérez",
        "photo_url": "https://.../juan.jpg",
        "trade_primary": "Gasfiter"
      },
      "can_review": true
    }
  ],
  "next_cursor": "eyJ0IjoxNzQ5OTg5MjYwLCJpIjoxMjN9"
}
```

- **Response 401** si no hay sesión.
- **Cursor:** opaco (base64), generado a partir del último item; no se documenta estructura interna.

## Validaciones Zod

```ts
// src/lib/validators/contacts-history.ts
import { z } from 'zod'

export const contactsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
})

export type ContactsListQuery = z.infer<typeof contactsListQuerySchema>
```

## Componentes UI

- `src/components/dashboard/user/ContactsHistory.astro` — recibe `items: ContactHistoryItem[]` y `nextCursor?: string`. Lista filas con avatar + nombre + chip oficio + botón "Re-contactar" (link al WhatsApp guardado en `provider.contacts`) + botón "Dejar reseña" si `can_review=true`.
- `src/components/dashboard/user/ContactRow.astro` — fila individual, extraída para poder testearla aislada.
- Paginación: link "Ver más" que apunta a `?cursor=<next_cursor>` (full reload SSR, no infinito scroll).

Estilo: replica `mockups/dashboard-user.html:71-97` (fila en card con rounded-2xl, hover bg-white, ícono WhatsApp verde a la derecha).

## Flujo de interaccion (secuencial)

1. Vecino GET `/dashboard-user?tab=contacts` → SSR llama `GET /api/v1/users/me/contacts?limit=20`.
2. Servicio `listUserContacts(env, userId, { limit, cursor })` ejecuta SQL:
   ```sql
   SELECT ce.id, ce.kind, ce.created_at, p.slug, p.name, p.photo_url, t.name AS trade_primary,
          EXISTS(SELECT 1 FROM reviews r WHERE r.provider_id = ce.provider_id AND r.user_id = ?) AS can_review
   FROM contact_events ce
   JOIN providers p ON p.id = ce.provider_id
   LEFT JOIN provider_trades pt ON pt.provider_id = p.id AND pt.is_primary = 1
   LEFT JOIN trades t ON t.id = pt.trade_id
   WHERE ce.user_id = ?
   ORDER BY ce.created_at DESC, ce.id DESC
   LIMIT ? OFFSET 0;
   -- paginación real: cursor = encode({t: last.created_at, id: last.id})
   -- siguiente query: WHERE (created_at, id) < (?, ?)
   ```
3. Devuelve items + `next_cursor` (o `null` si `count(items) < limit`).
4. Vecino click "Ver más" → GET `?cursor=...` → repite.

## Capa de servicios

```ts
// src/lib/services/contact-events.ts (firmas adicionales)
export interface ContactHistoryItem {
  id: number
  kind: 'whatsapp' | 'phone' | 'email'
  createdAt: Date
  provider: { slug: string; name: string; photoUrl: string | null; tradePrimary: string | null }
  canReview: boolean
}

export async function listUserContacts(
  env: Env,
  userId: number,
  opts: { limit: number; cursor?: string },
): Promise<{ items: ContactHistoryItem[]; nextCursor: string | null }>

export function encodeCursor(createdAt: Date, id: number): string
export function decodeCursor(cursor: string): { createdAt: Date; id: number }
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/contacts-history/cursor.test.ts` | encode/decode simétrico, cursor inválido → throw |
| Unit | `tests/unit/contacts-history/canReview.test.ts` | ventana 7 días vs sin respuesta del prestador |
| Integracion | `tests/integration/users/contacts-history.test.ts` | Vecino A recibe sólo suyos, paginación real con 14 filas, `can_review` correcto |
| Integracion | `tests/integration/users/contacts-history-cross-user.test.ts` | A no ve nada de B; admin sin sesión → 401 |
| E2E | `tests/e2e/contacts-history.spec.ts` | Tab "Historial" muestra filas; click "Dejar reseña" navega |

## Dependencias y secuencia

- **Bloqueado por:** HU-08.1 (tabla `contact_events`), REQ-01 (sesión), REQ-02 (rol `vecino`), HU-11.1 (route + tab).
- **Bloquea a:** HU-09.x (reseñas — el CTA "Dejar reseña" navega a esa ruta).
- **Recursos compartidos:** `src/database/schema.ts`, `Astro.locals.user`.

## Riesgos tecnicos

- Riesgo: el cursor opaco codifica `created_at` + `id` y rompe si el cliente lo manipula → Mitigación: cualquier excepción al decodificar cae a `limit=20` desde el inicio (no 4xx).
- Riesgo: query con `EXISTS` de `reviews` por fila es N+1 si se hace en JS → Mitigación: el `EXISTS` es subquery SQL (no loop).
- Riesgo: índice `(user_id, created_at DESC)` no se usa si el `WHERE` no incluye `user_id` → Mitigación: el `userId` viene de la sesión, nunca de query string.
