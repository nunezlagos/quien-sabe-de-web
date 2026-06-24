# Diseno tecnico — HU-05.3 — Cobertura multi-comuna del servicio

**REQ padre:** REQ-05-catalogo-servicios

## Modelo de datos

No agrega tablas. Consume `service_coverage` (de HU-05.1) y `communes` (de REQ-02).

## Contrato de API

Extiende `PATCH /api/v1/providers/me/services/[id]` (de HU-05.2). Acepta campo opcional `coverage_commune_ids: number[]`.

**Request body** (extiende `ServicePatch`)
```ts
{
  // ... otros campos de HU-05.2
  coverage_commune_ids?: number[]
}
```

**Response 200** — servicio actualizado con campo derivado `coverage_communes: [{ id, slug, name }, ...]` (JOIN resuelto server-side para que el cliente no necesite segundo request).

**Errores**
- 422 `{ "error": "commune inválida", "invalid_ids": [99999] }`
- 403 / 404 según ownership.

## Validaciones Zod

```ts
// src/lib/validators/services.ts (extiende HU-05.2)
export const servicePatchSchema = serviceCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
  coverageCommuneIds: z.array(z.number().int().positive()).max(60).optional(),
})
```

Límite de 60 comunas para evitar payloads absurdos (RM tiene 52 comunas + algo de margen).

## Componentes UI

Esta HU es backend. El multi-select visual se entrega como parte del
form de edición de servicio en HU-12 (dashboard prestador). El
endpoint ya acepta y devuelve los datos correctos para renderizar.

## Flujo de interaccion (secuencial)

**PATCH con `coverage_commune_ids`**:
1. Handler Zod-valida body (incluyendo `coverageCommuneIds` si presente).
2. Valida ownership del servicio (HU-05.2 subquery).
3. Si `coverageCommuneIds` presente:
   a. Dedupe + ordenar.
   b. `db.transaction(async (tx) => { ... })`:
      - `SELECT id FROM communes WHERE id IN (...)` → set de IDs válidos.
      - Si `validSet.size !== coverageCommuneIds.length` → throw → 422.
      - `DELETE FROM service_coverage WHERE service_id = ?`.
      - `INSERT INTO service_coverage (service_id, commune_id) VALUES (...), (...)`.
   c. Si la transacción tira → 422 con detalle.
4. Si hay otros campos en el patch → UPDATE del servicio (dentro o fuera de la tx según decida el handler; documentado).
5. Devolver 200 con servicio + `coverage_communes` resuelto.

## Capa de servicios

- `src/lib/services/service-coverage.ts` (firmas):
  - `replaceCoverage(db, serviceId, communeIds): Promise<void>` — transacción con validación.
  - `getCoverageForService(db, serviceId): Promise<{ id, slug, name }[]>`
- `src/lib/services/services.ts` (extiende HU-05.2):
  - `updateService` ya delega a `replaceCoverage` cuando `coverageCommuneIds` está presente.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/services.test.ts` (extiende) | `coverageCommuneIds` con > 60 elementos rechazado; acepta array vacío |
| Integracion | `tests/integration/services/coverage.test.ts` | Asignar 3 comunas; reemplazar por 1; comuna inexistente 422; array vacío limpia; atomicidad (spy sobre SELECT no ve estado parcial) |
| Integracion | `tests/integration/services/coverage-ownership.test.ts` | PATCH con coverage sobre servicio ajeno → 403, `service_coverage` del servicio ajeno intacto |

## Dependencias y secuencia

- **Bloqueado por:** HU-05.1 (`service_coverage`), HU-05.2 (PATCH endpoint + servicio), REQ-02 (`communes`).
- **Bloquea a:** HU-06.1 (búsqueda por comuna usa `service_coverage`).
- **Recursos compartidos:** `db.transaction` de Drizzle, binding D1.

## Riesgos tecnicos

- Riesgo: `IN (?)` con array vacío produce SQL inválido en D1 → Mitigación: el servicio hace rama explícita: `if (communeIds.length === 0) return deleteCoverage(db, serviceId)`.
- Riesgo: transacción D1 muy larga con muchos inserts (60) → Mitigación: D1 soporta transacciones razonables; 60 inserts es trivial; bench en HU-06.7.
- Riesgo: la validación de communes (`SELECT ... IN`) está dentro de la tx pero el handler hace el SELECT fuera → Mitigación: hacer el SELECT **dentro** de la transacción para que sea consistente con los INSERTs siguientes.
