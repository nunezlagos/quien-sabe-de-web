# Diseno tecnico — HU-05.2 — CRUD de servicios del prestador

**REQ padre:** REQ-05-catalogo-servicios

## Modelo de datos

No agrega tablas. Consume `services` (de HU-05.1).

## Contrato de API

### `GET /api/v1/providers/me/services` — sesión prestador

**Response 200**
```json
{
  "items": [
    { "id": 7, "title": "Cambio de llave", "price_clp": 15000, "unit": "visita", "sort_order": 0, "status": "active", "description": "" },
    { "id": 8, "title": "Destape de cañería", "price_clp": 25000, "unit": "visita", "sort_order": 1, "status": "active", "description": "" }
  ]
}
```

### `POST /api/v1/providers/me/services` — sesión prestador

**Request body** (Zod `ServiceCreate`)
```ts
{
  title: string().min(3).max(100),
  description?: string().max(1000).default(''),
  price_clp?: number().int().positive().max(10_000_000).optional(), // null = "Consultar"
  unit: enum(['hora', 'visita', 'proyecto']),
}
```

**Response 201** — cuerpo del servicio creado (mismo shape que GET, sin `coverage_commune_ids` — eso vive en HU-05.3).
**Response 404** — sesión no tiene perfil de prestador.

### `PATCH /api/v1/providers/me/services/[id]` — sesión prestador

Todos los campos opcionales; schema `ServicePatch` = `Partial(ServiceCreate).extend({ status: enum(['active', 'inactive']).optional() })`. Cobertura se acepta pero se delega a HU-05.3 (`coverage_commune_ids` opcional en el patch, si está se procesa atómicamente).

**Response 200** — servicio actualizado.
**Response 403** — el servicio pertenece a otro prestador.
**Response 404** — el servicio no existe.

### `DELETE /api/v1/providers/me/services/[id]` — sesión prestador

**Response 204** sin body.
**Response 403** — el servicio pertenece a otro prestador.
**Response 404** — el servicio no existe.

## Validaciones Zod

```ts
// src/lib/validators/services.ts
export const serviceCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).default(''),
  priceClp: z.number().int().positive().max(10_000_000).optional(),
  unit: z.enum(['hora', 'visita', 'proyecto']),
  coverageCommuneIds: z.array(z.number().int().positive()).optional(), // HU-05.3
})

export const servicePatchSchema = serviceCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
})

export type ServiceCreate = z.infer<typeof serviceCreateSchema>
export type ServicePatch = z.infer<typeof servicePatchSchema>
```

`priceClp` es opcional en el schema; si el cliente envía `null` explícito o lo omite, el servicio persiste `price_clp = null` ("Consultar"). El CHECK `price_clp IS NULL OR price_clp > 0` (de HU-05.1) acepta ambos casos.

## Componentes UI

Esta HU es backend + validador. La sección "Mis Servicios Activos" del dashboard (`mockups/dashboard-provider.html:198-225`) y los handlers de los botones se entregan en HU-12.

## Flujo de interaccion (secuencial)

**POST**:
1. Front hace `POST` con body.
2. Handler Zod-valida, normaliza título (`normalizeTitle`).
3. Resuelve `providerId` desde `session.userId`.
4. Calcula `sort_order = (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM services WHERE provider_id = ? AND status != 'deleted')`.
5. INSERT.
6. Devuelve 201.

**PATCH**:
1. Front hace `PATCH /api/v1/providers/me/services/[id]`.
2. Handler valida ownership con subquery.
3. Si no es del prestador → 403.
4. Si OK, aplica UPDATE con los campos del patch.
5. Si `coverageCommuneIds` presente → delega a `replaceCoverage` (HU-05.3).
6. Devuelve 200.

**DELETE**:
1. Valida ownership.
2. `DELETE FROM services WHERE id = ? AND provider_id = ?` (cascade borra `service_coverage`).
3. Devuelve 204.

## Capa de servicios

- `src/lib/services/services.ts` (firmas):
  - `listServicesByProvider(db, providerId): Promise<Service[]>`
  - `createService(db, providerId, input): Promise<Service>`
  - `updateService(db, providerId, serviceId, patch): Promise<Service>`
  - `deleteService(db, providerId, serviceId): Promise<void>`
  - `normalizeTitle(raw: string): string`
- `src/lib/services/service-coverage.ts` (firmas, cuerpo en HU-05.3):
  - `replaceCoverage(db, serviceId, communeIds): Promise<void>`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/services.test.ts` | Zod rechaza `title` corto, `price_clp` negativo, `unit` fuera de enum; acepta boundary |
| Unit | `tests/unit/services/services.test.ts` | `normalizeTitle` colapsa espacios y capitaliza; `sortOrder` se asigna correctamente |
| Integracion | `tests/integration/services/crud.test.ts` | round-trip GET/POST/PATCH/DELETE; 404 sin perfil; 403 sobre servicio ajeno; cascade de DELETE borra service_coverage |

## Dependencias y secuencia

- **Bloqueado por:** HU-05.1 (`services`), HU-04.2 (sesión y perfil de prestador).
- **Bloquea a:** HU-05.3 (extiende PATCH con coverage), HU-05.4 (endpoint reorder usa estos servicios), HU-05.5 (toggle via PATCH), HU-06.1 (búsqueda lee estos servicios).
- **Recursos compartidos:** `Astro.locals.session`, `Astro.locals.runtime.env.DB`.

## Riesgos tecnicos

- Riesgo: el normalizador de título cambia palabras en mayúsculas (ej: "iPhone" → "Iphone") → Mitigación: capitalize sólo el primer caracter; resto se preserva.
- Riesgo: subquery de ownership agrega latencia en cada PATCH → Mitigación: índice por `id` en `services` ya cubre la subquery; documentado y medido en bench HU-06.7.
- Riesgo: `coverage_commune_ids` en el PATCH rompe atomicidad con el resto del patch si la mitad tiene éxito → Mitigación: HU-05.3 entrega `replaceCoverage` con transacción; si falla, rollback del UPDATE del servicio.
