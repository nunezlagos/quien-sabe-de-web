# Diseno tecnico — HU-14.9 — Métrica del ratio donaciones/costos (OE3)

**REQ padre:** REQ-14-donaciones-pagos

## Modelo de datos

No introduce tablas. Lee:
- `donations` (HU-14.2) — `status='approved'` agrupados por mes y total YTD.
- `expenses` (REQ-14 dependencia externa) — mismo.

## Contrato de API

### `GET /api/v1/public/transparency/summary`

- **Auth:** público.
- **Query:** `year?: number` (default año actual).
- **Response 200:**
  ```json
  {
    "year": 2026,
    "ratio_ytd": 0.80,
    "no_expenses": false,
    "pending_data": false,
    "by_month": [
      { "month": "2026-01", "donations_clp": 50000, "expenses_clp": 80000, "ratio": 0.625 },
      ...
    ],
    "computed_at": "2026-06-18T12:00:00Z",
    "cache": "HIT"
  }
  ```
- Headers: `X-Cache: HIT|MISS`, `Cache-Control: public, max-age=300`.

## Validaciones Zod

```ts
// src/lib/validators/transparency.ts
import { z } from 'zod'

export const transparencyQuerySchema = z.object({
  year: z.coerce.number().int().min(2024).max(2099).optional(),
})
```

## Componentes UI

Reuso del template `mockups/transparency.html` (REQ-15 lo renderiza). Esta HU sólo provee el endpoint y el servicio.

Helper `formatRatio(ratio: number | null, noExpenses: boolean): string` en `src/lib/utils/format.ts`:
- `null` + `noExpenses=true` → `"— (sin gastos registrados)"`
- `null` + `noExpenses=false` → `"—"`
- número → `"80%"` (sin decimales si entero, con 1 decimal si <1).

## Flujo de interaccion (secuencial)

1. Visitante GET `/transparency` → SSR llama `GET /api/v1/public/transparency/summary`.
2. Servicio `getTransparencySummary(env, { year })`:
   - Lee `env.KV.get('transparency:summary:<year>')`. Si HIT → retorna.
   - Si MISS → ejecuta queries:
     - `SELECT strftime('%Y-%m', datetime(created_at, 'unixepoch')) AS month, SUM(amount_clp) FROM donations WHERE status='approved' AND created_at >= ? GROUP BY month`
     - Idem para `expenses`.
   - Construye `by_month` con `computeRatio` por mes + agregado YTD.
   - `env.KV.put(...)` con TTL 300s.
3. UI renderiza cards.

## Capa de servicios

```ts
// src/lib/services/finance/ratio.ts (función pura)
export interface RatioResult {
  ratio: number | null
  noExpenses: boolean
}

export function computeRatio(donations: number, expenses: number): RatioResult {
  if (expenses === 0) {
    return donations > 0
      ? { ratio: null, noExpenses: true } // hay donaciones pero no gastos
      : { ratio: null, noExpenses: true } // sin gastos, sin donaciones
  }
  return { ratio: donations / expenses, noExpenses: false }
}

// src/lib/services/finance/transparency.ts (firmas)
export interface TransparencySummary {
  year: number
  ratioYtd: number | null
  noExpenses: boolean
  pendingData: boolean
  byMonth: Array<{ month: string; donationsClp: number; expensesClp: number | null; ratio: number | null }>
  computedAt: Date
}

export async function getTransparencySummary(env: Env, opts: { year?: number; forceRefresh?: boolean }): Promise<TransparencySummary & { cache: 'HIT' | 'MISS' }>

export async function invalidateTransparencyCache(env: Env): Promise<void>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/finance/computeRatio.test.ts` | 5 casos: donations=800k/expenses=1M → 0.8; expenses=0 + donations>0 → null noExpenses; donations=0/expenses>0 → 0; donations=0/expenses=0 → null noExpenses; donations/expenses infinitos (overflow) |
| Unit | `tests/unit/finance/formatRatio.test.ts` | null+noExpenses → "— (sin gastos)"; null sin noExpenses → "—"; 0.8 → "80%"; 0.625 → "62.5%" |
| Unit | `tests/unit/transparency/query-schema.test.ts` | year <2024 rechaza; >2099 rechaza |
| Integracion | `tests/integration/finance/transparency-endpoint.test.ts` | GET público con seed donations/expenses → ratio correcto; cache HIT segunda llamada; force_refresh MISS |
| Integracion | `tests/integration/finance/transparency-excludes-refunded.test.ts` | Donation refunded NO se suma |
| E2E | `tests/e2e/transparency.spec.ts` | Visitante ve ratio en /transparency; admin ve desglose en /dashboard-admin?section=finances |

## Dependencias y secuencia

- **Bloqueado por:** HU-14.2 (donations tabla).
- **Bloquea a:** REQ-15 (página `/transparency` consume este endpoint), HU-13.5 (admin finanzas reusa `computeRatio`).
- **Recursos compartidos:** `computeRatio` es consumido por múltiples HUs; vive como single source of truth.

## Riesgos tecnicos

- Riesgo: división por cero si expenses=0 → Mitigación: helper maneja el caso explícitamente; tests lo cubren.
- Riesgo: el ratio cambia cuando se reembolsan donaciones (se restan del approved) → Mitigación: el cálculo filtra `status='approved'`, lo que excluye refunded automáticamente.
- Riesgo: cache stale durante campañas → Mitigación: TTL 5 min + invalidación manual disponible (botón admin).
