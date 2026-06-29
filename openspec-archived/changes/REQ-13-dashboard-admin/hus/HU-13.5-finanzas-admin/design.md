# Diseno tecnico — HU-13.5 — Sección finanzas admin (donaciones/costos)

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

No introduce tablas. Lee:
- `donations` (HU-14.2) — `status='approved'`, agregados por mes y total.
- `expenses` (REQ-14 dependencia externa; tabla administrada por admin vía CRUD futuro) — `amount_clp`, `category`, `date`.

Si `expenses` no existe, los KPIs relacionados devuelven `pending_data: true`.

## Contrato de API

### `GET /api/v1/admin/finances/summary`

- **Auth:** admin.
- **Query:**
  - `from?: string` (YYYY-MM-DD, default inicio del año actual).
  - `to?: string` (YYYY-MM-DD, default hoy).
- **Response 200:**
  ```json
  {
    "from": "2026-01-01",
    "to": "2026-06-30",
    "donations_total_clp": 800000,
    "donations_count": 142,
    "expenses_total_clp": 1000000,
    "expenses_by_category": [
      { "category": "hosting", "amount_clp": 250000 },
      { "category": "domain", "amount_clp": 9990 }
    ],
    "ratio": 0.80,
    "no_expenses": false,
    "pending_data": false,
    "by_month": [
      { "month": "2026-01", "donations_clp": 50000, "expenses_clp": 80000, "ratio": 0.625 },
      ...
    ]
  }
  ```

## Validaciones Zod

```ts
// src/lib/validators/admin-finances.ts
import { z } from 'zod'

export const financesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine((q) => {
  if (q.from && q.to) return new Date(q.from) <= new Date(q.to)
  return true
}, { message: 'from debe ser <= to' })
```

## Componentes UI

- `src/components/admin/FinancesPanel.astro` — sección con 3 KPIs arriba (Donaciones, Gastos, Ratio), tabla `by_month` abajo con barras de progreso por mes.
- `src/components/admin/FinanceKpiCard.astro` — KPI card con label + valor formateado CLP + flag `pending_data`.
- Filtros arriba: date pickers nativos (`<input type="date">`) + botón "Aplicar" que recarga `?from&to`.
- Botón "Exportar CSV" (HU futura; acá dejamos el botón disabled con tooltip "próximamente").

Estilo visual: replica `mockups/transparency.html:46-58` (3 cards KPI) + tabla `mockups/transparency.html:61-98` para `by_month`.

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin?section=finances` → SSR llama `GET /api/v1/admin/finances/summary`.
2. Servicio `getFinancesSummary(env, { from, to })`:
   - Parsea rango.
   - Query 1: `SELECT SUM(amount_clp) AS total, COUNT(*) AS count FROM donations WHERE status = 'approved' AND created_at BETWEEN ? AND ?`.
   - Query 2: `SELECT SUM(amount_clp) AS total FROM expenses WHERE date BETWEEN ? AND ?` (try/catch si tabla no existe).
   - Query 3: `SELECT category, SUM(amount_clp) FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category`.
   - Query 4: serie mensual con `strftime('%Y-%m', date) AS month` agrupando ambas tablas.
   - Llama `computeRatio(donationsTotal, expensesTotal)` (de HU-14.9).
   - Retorna payload.
3. UI renderiza KPIs + tabla. Si `pending_data: true` → muestra "—" en gastos.

## Capa de servicios

```ts
// src/lib/services/admin/finances.ts (firmas)
import type { computeRatio } from '@/lib/services/finance/ratio'

export interface FinancesSummary {
  from: string
  to: string
  donationsTotalClp: number
  donationsCount: number
  expensesTotalClp: number | null
  expensesByCategory: Array<{ category: string; amountClp: number }>
  ratio: number | null
  noExpenses: boolean
  pendingData: boolean
  byMonth: Array<{ month: string; donationsClp: number; expensesClp: number | null; ratio: number | null }>
}

export async function getFinancesSummary(env: Env, opts: { from?: string; to?: string }): Promise<FinancesSummary>
```

Reuso: `computeRatio(donations: number, expenses: number): { ratio: number | null; noExpenses: boolean }` de `src/lib/services/finance/ratio.ts` (definido por HU-14.9).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-finances/finances-query-schema.test.ts` | from > to rechaza; formatos inválidos rechazan |
| Unit | `tests/unit/admin-finances/computeRatio.test.ts` | reuso del helper (cubierto por HU-14.9; acá smoke test) |
| Integracion | `tests/integration/admin/finances-summary.test.ts` | Con fixtures: donations=800k, expenses=1M → ratio 0.80; expenses=0 → ratio null no_expenses=true |
| Integracion | `tests/integration/admin/finances-filters.test.ts` | Filtros from/to aplicados correctamente |
| Integracion | `tests/integration/admin/finances-rbac.test.ts` | Vecino → 403; sin sesión → 401 |
| Integracion | `tests/integration/admin/finances-pending.test.ts` | Tabla `expenses` ausente → KPIs con pending_data=true |
| E2E | `tests/e2e/admin-finances.spec.ts` | Admin abre sección, ve KPIs, aplica filtro rango, ve tabla |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), HU-14.9 (`computeRatio`), HU-14.2 (`donations` tabla).
- **Bloquea a:** REQ-15 (transparencia pública consume datos agregados).
- **Recursos compartidos:** `src/lib/services/finance/ratio.ts`.

## Riesgos tecnicos

- Riesgo: la serie `by_month` con SQL puro en SQLite es verbosa → Mitigación: usar `strftime('%Y-%m', datetime(created_at, 'unixepoch'))` para agrupar.
- Riesgo: si `expenses` se crea en una HU posterior con schema distinto al asumido, el servicio rompe → Mitigación: encapsular queries en try/catch con `pendingData: true` como fallback.
- Riesgo: ratio con NaN si donations/expenses no son números → Mitigación: el helper `computeRatio` ya valida tipos; tests unit lo cubren.
