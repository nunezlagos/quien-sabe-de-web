# Diseno tecnico — HU-06.7 — Suite de aceptación con precisión 100% (OE2)

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No aplica. Consume fixtures JSON.

## Contrato de API

No agrega endpoints. Consume `/api/v1/search` (HU-06.1+).

## Validaciones Zod

Reusa `searchParamsSchema` de HU-06.1/HU-06.2. Agrega schema para validar `expected-queries.json`:

```ts
// tests/fixtures/search/schema.ts
export const expectedQuerySchema = z.object({
  id: z.string(),
  params: searchParamsSchema,
  expected_ids: z.array(z.number().int().positive()),
  note: z.string().optional(),
})
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

**Suite de aceptación**:
1. Test setup carga `tests/fixtures/search/providers-50.json` en D1 (con `@cloudflare/vitest-pool-workers`).
2. Carga `expected-queries.json`.
3. Para cada query: `GET /api/v1/search?<params>` (vía cliente interno, no HTTP).
4. Compara `Set(response.items.map(i => i.id))` con `Set(expected.expected_ids)`.
5. Si difieren → test rojo con detalle (delta esperado/actual).
6. Si difiere aunque sea UNA query → suite falla → bloquea merge.

**Bench p95**:
1. Setup con el mismo fixture.
2. `vitest.bench` corre N=100 queries (mezcla representativa).
3. Reporta p50, p95, p99.
4. Test verifica `p95 < 500 ms`.

## Capa de servicios

No agrega servicios. La suite es un test runner.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Acceptance | `tests/acceptance/search-precision.test.ts` | 30 queries contra fixture; compara sets; reporte de delta si falla |
| Bench | `tests/bench/search.bench.ts` | p50, p95, p99 sobre 100 queries mixtas |
| Unit | `tests/unit/fixtures/search.test.ts` | Validador de `expected-queries.json`; shape de fixture |

## Fixtures

### `tests/fixtures/search/providers-50.json`

Estructura mínima:
```json
{
  "users": [{ "id": 1, "email": "u1@test.cl" }, ...],
  "trades": [{ "id": 1, "slug": "gasfiter", "name": "Gasfíter" }, ...],
  "communes": [{ "id": 13114, "slug": "las-condes", "name": "Las Condes" }, ...],
  "providers": [
    { "id": 1, "user_id": 1, "trade_id": 1, "commune_id": 13114, "status": "published", "slug": "p1", ... },
    ...
  ],
  "verifications": [{ "provider_id": 1, "status": "approved" }, ...],
  "services": [
    { "id": 1, "provider_id": 1, "price_clp": 25000, "unit": "hora", "sort_order": 0, "status": "active" },
    ...
  ],
  "reviews": [
    { "provider_id": 1, "rating": 4.8, "status": "visible" },
    ...
  ]
}
```

Diseño: 50 prestadores cubriendo combinaciones conocidas (5 oficios x 5 comunas x verificado/no + ratings variados).

### `tests/fixtures/search/expected-queries.json`

30 queries con `params` y `expected_ids` calculados manualmente al momento de crear el fixture. Cada query cubre una combinación distinta.

## Dependencias y secuencia

- **Bloqueado por:** HU-06.1 (endpoint base), HU-06.2 (filtros), HU-06.3 (paginación).
- **Bloquea a:** release del producto (OE2).
- **Recursos compartidos:** fixtures JSON, suite de tests.

## Riesgos tecnicos

- Riesgo: `vitest.bench` p95 flaky en CI por ruido → Mitigación: CI corre N veces y toma mediana; threshold 500 ms se evalúa contra la mediana de p95.
- Riesgo: el fixture se vuelve obsoleto si cambia el schema → Mitigación: el loader valida contra Zod y falla ruidosamente; además, una HU que cambie el shape debe actualizar el fixture.
- Riesgo: la suite es tan estricta que bloquea mejoras legítimas → Mitigación: cada cambio intencional en el comportamiento debe venir con un cambio correspondiente en `expected-queries.json` (PR review explícito).
