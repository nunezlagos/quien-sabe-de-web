# Diseno tecnico — HU-04.2 — CRUD del perfil de prestador con Zod

**REQ padre:** REQ-04-perfil-prestador

## Modelo de datos

Esta HU no agrega tablas. Consume la tabla `providers` de HU-04.1.

### Campos relevantes del schema (recall)

- `providers.id`, `providers.userId` (UNIQUE), `providers.tradeId`, `providers.communeId`
- `providers.description`, `providers.phone`, `providers.whatsapp`, `providers.emailPublic`
- `providers.hourlyRateClp`, `providers.slug`, `providers.status`
- `createdAt`, `updatedAt` se actualizan automáticamente.

## Contrato de API

### `GET /api/v1/providers/me` — sesión prestador requerida

**Response 200**
```json
{
  "id": 42,
  "userId": 7,
  "trade": { "id": 1, "slug": "gasfiter", "name": "Gasfíter" },
  "commune": { "id": 13114, "slug": "las-condes", "name": "Las Condes" },
  "description": "15 años de oficio",
  "phone": "+56912345678",
  "whatsapp": "+56912345678",
  "emailPublic": null,
  "hourlyRateClp": 25000,
  "photoUrl": null,
  "coverUrl": null,
  "slug": "juan-perez-gasfiter-las-condes",
  "status": "draft",
  "createdAt": "2026-06-18T12:00:00Z",
  "updatedAt": "2026-06-18T12:00:00Z"
}
```

**Response 404** — el usuario autenticado no tiene perfil de prestador.

### `POST /api/v1/providers/me` — sesión prestador requerida

**Request body** (Zod `ProviderCreate`)
```ts
{
  tradeId: number().int().positive(),
  communeId: number().int().positive(),
  description?: string().max(2000).default(''),
  phone?: string().regex(/^\+?[0-9]{8,15}$/),
  whatsapp?: string().regex(/^\+?[0-9]{8,15}$/),
  emailPublic?: string().email(),
  hourlyRateClp?: number().int().min(0).max(10_000_000),
}
```

**Response 201** — cuerpo del perfil creado (mismo shape que GET).
**Response 409** — `{ "error": "perfil ya existe" }` cuando ya hay fila con `user_id=session.userId`.

### `PATCH /api/v1/providers/me` — sesión prestador requerida

Todos los campos del `ProviderCreate` son **opcionales**; el schema
`ProviderPatch` es `Partial(ProviderCreate)`. Adicionalmente acepta
`{ status: 'draft' | 'published' }` para HU-04.4.

**Response 200** — perfil actualizado.
**Response 404** — no existe perfil.

### `DELETE /api/v1/providers/me` — sesión prestador requerida

Soft-delete: `UPDATE providers SET status = 'deleted', updated_at = unixepoch() WHERE user_id = ?`.

**Response 204** sin body.
**Response 404** — no existe perfil.

## Validaciones Zod

```ts
// src/lib/validators/providers.ts
const phoneRe = /^\+?[0-9]{8,15}$/

export const providerCreateSchema = z.object({
  tradeId: z.number().int().positive(),
  communeId: z.number().int().positive(),
  description: z.string().max(2000).default(''),
  phone: z.string().regex(phoneRe).optional(),
  whatsapp: z.string().regex(phoneRe).optional(),
  emailPublic: z.string().email().optional().or(z.literal('')),
  hourlyRateClp: z.number().int().min(0).max(10_000_000).optional(),
})

export const providerPatchSchema = providerCreateSchema.partial().extend({
  status: z.enum(['draft', 'published']).optional(),
})

export type ProviderCreate = z.infer<typeof providerCreateSchema>
export type ProviderPatch = z.infer<typeof providerPatchSchema>
```

Sanitización de `description` se aplica **después** de validar Zod,
con `DOMPurify` configurado en `ALLOWED_TAGS: []` (sólo texto) o
lista blanca conservadora (`b`, `i`, `br`, `ul`, `li`, `p`).

## Componentes UI

Esta HU es backend + validador. Los formularios que llaman a estos
endpoints se renderizan en `mockups/dashboard-provider.html:126-194`
(form de "Editar Perfil") y `mockups/create-trade.html:50-100`. Los
componentes Astro se entregan en HU-04.4 (preview) y HU-12 (dashboard
completo).

## Flujo de interaccion (secuencial)

1. Prestador autenticado entra a `/dashboard-provider`.
2. Front hace `GET /api/v1/providers/me` → si 404, renderiza form de creación; si 200, renderiza form de edición con datos.
3. Submit → `POST` o `PATCH` con `providerCreateSchema` o `providerPatchSchema`.
4. Handler Zod-valida, sanitiza `description`, genera `slug` (HU-04.1 helper), persiste vía Drizzle.
5. Devuelve 201/200 con shape canónico.
6. Si `tradeId` o `communeId` cambió → emite hook que HU-04.5 conecta a `reindexProvider(id)`.

## Capa de servicios

- `src/lib/services/providers.ts` (firmas):
  - `getProviderByUser(db, userId): Promise<Provider | null>`
  - `createProvider(db, userId, input): Promise<Provider>` — genera slug único
  - `updateProvider(db, userId, patch): Promise<Provider>` — diff fields, emite `reindexNeeded` flag
  - `softDeleteProvider(db, userId): Promise<void>`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/providers.test.ts` | Zod rechaza `tradeId <= 0`, `phone` mal formado, `hourlyRateClp > 10M`; acepta boundary cases |
| Unit | `tests/unit/services/providers.test.ts` | `generateProviderSlug` colisión → sufijo; `sanitizeDescription` quita `<script>` |
| Integracion | `tests/integration/providers/crud.test.ts` | GET/POST/PATCH/DELETE round-trip; 409 en POST duplicado; 404 sin perfil; soft-delete preserva fila |
| Integracion | `tests/integration/providers/auth.test.ts` | Sin sesión → 401; sesión de vecino (no prestador) → 200/404 según perfil existente |

## Dependencias y secuencia

- **Bloqueado por:** HU-04.1 (`providers` + `trades`), REQ-01 (sesión), REQ-03 (verificación — el endpoint chequea `verified=true` antes de permitir `status='published'`? documentado, no implementado acá).
- **Bloquea a:** HU-04.3 (foto), HU-04.4 (preview), HU-04.5 (reindex), HU-12 (dashboard prestador).
- **Recursos compartidos:** `Astro.locals.session`, `Astro.locals.runtime.env.DB`.

## Riesgos tecnicos

- Riesgo: concurrencia en `POST` (dos requests paralelos con misma sesión) podrían ambos pasar antes del `UNIQUE` → Mitigación: D1/UNIQUE constraint falla el segundo insert; mapeamos a 409 idempotente.
- Riesgo: sanitización agresiva de `description` rompe formato del usuario → Mitigación: lista blanca explícita de tags permitidos + test que verifica que un párrafo con `<b>` se preserva.
- Riesgo: helper de slug genera el mismo slug para dos prestadores distintos → Mitigación: `generateProviderSlug` agrega sufijo aleatorio de 4 chars al colisionar (test unit explícito).
