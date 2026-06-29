# Diseno tecnico — HU-13.4 — Widgets de métricas globales (KPIs)

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

No introduce tablas. Lee:
- `users` (REQ-01) — `signups_30d`.
- `contact_events` (HU-08.1) — `contacts_30d`.
- `donations` (HU-14.2), `expenses` (HU-14.5/out-of-scope-acá, queda como dependencia externa) — `ratio_donations_costs`.
- `search_logs` (REQ-06) — `precision_search`.
- `request_logs` (REQ-18) — `p95_ms_search`.

Si una tabla no existe al deploy, el KPI correspondiente devuelve `null` con `pending_data: true` (no rompe el endpoint).

## Contrato de API

### `GET /api/v1/admin/analytics/kpis`

- **Auth:** admin.
- **Query params:** `force_refresh=1` (opcional, salta cache).
- **Response 200:**
  ```json
  {
    "computed_at": "2026-06-18T12:00:00Z",
    "ttl_seconds": 300,
    "cache": "HIT" | "MISS",
    "kpis": {
      "signups_30d": { "value": 142, "pending_data": false },
      "contacts_30d": { "value": 873, "pending_data": false },
      "ratio_donations_costs": { "value": 0.42, "pending_data": false },
      "p95_ms_search": { "value": 230, "pending_data": false },
      "precision_search": { "value": 0.78, "pending_data": false }
    }
  }
  ```
- Headers: `X-Cache: HIT|MISS`.
- 403 si no admin.

## Validaciones Zod

No hay body. Query schema:

```ts
// src/lib/validators/admin-kpis.ts
import { z } from 'zod'

export const kpisQuerySchema = z.object({
  force_refresh: z.enum(['0', '1']).optional(),
})
```

## Componentes UI

- `src/components/admin/KpisOverview.astro` — grid responsive (`grid-cols-1 md:grid-cols-3 lg:grid-cols-5`) con 5 cards. Replica visualmente `mockups/dashboard-admin.html:69-105`.
- `src/components/admin/KpiCard.astro` — card individual con título, valor (formateado), delta (variación vs periodo anterior si tenemos histórico), ícono.
- Botón "Refrescar" arriba a la derecha que llama con `?force_refresh=1`.

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin` → SSR llama `GET /api/v1/admin/analytics/kpis`.
2. Servicio `getKpis(env, { forceRefresh })`:
   - Lee `await env.KV.get('kpis:global')`.
   - Si existe y `!forceRefresh` → parsea, setea `cache: 'HIT'`, retorna.
   - Si no → ejecuta 5 queries en paralelo:
     - `SELECT COUNT(*) FROM users WHERE created_at >= unixepoch() - 30*86400`
     - `SELECT COUNT(*) FROM contact_events WHERE created_at >= unixepoch() - 30*86400`
     - `SELECT ratio` (delegado a `computeRatio` de HU-14.9 con filtros del periodo actual)
     - `SELECT percentile_approx(latency_ms, 0.95) FROM request_logs WHERE path LIKE '/api/v1/providers%' AND created_at >= ...`
     - `SELECT AVG(relevance_score) FROM search_logs WHERE created_at >= ...`
   - Construye payload → `await env.KV.put('kpis:global', JSON.stringify(payload), { expirationTtl: 300 })`.
   - Retorna con `cache: 'MISS'`.
3. UI renderiza 5 cards; si algún KPI tiene `pending_data: true` → muestra "—" con tooltip "datos pendientes".
4. Click "Refrescar" → fetch con `?force_refresh=1` → reemplaza cards.

## Capa de servicios

```ts
// src/lib/services/admin/kpis.ts (firmas)
export interface KpiResult<T> { value: T; pendingData: boolean }
export interface KpisPayload {
  computedAt: Date
  ttlSeconds: number
  kpis: {
    signups30d: KpiResult<number>
    contacts30d: KpiResult<number>
    ratioDonationsCosts: KpiResult<number | null>
    p95MsSearch: KpiResult<number | null>
    precisionSearch: KpiResult<number | null>
  }
}

export async function getKpis(env: Env, opts?: { forceRefresh?: boolean }): Promise<KpisPayload & { cache: 'HIT' | 'MISS' }>

export async function invalidateKpisCache(env: Env): Promise<void>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-kpis/formatKpis.test.ts` | Null vs pending_data; valores con coma decimal |
| Integracion | `tests/integration/admin/kpis-cache.test.ts` | Primera llamada MISS; segunda HIT; force_refresh MISS again |
| Integracion | `tests/integration/admin/kpis-queries.test.ts` | 5 queries ejecutadas con seed; ratios correctos |
| Integracion | `tests/integration/admin/kpis-rbac.test.ts` | Vecino → 403; sin sesión → 401 |
| E2E | `tests/e2e/admin-kpis.spec.ts` | Dashboard muestra 5 cards; click refrescar re-ejecuta |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), REQ-01 (`users`), HU-08.1 (`contact_events`), REQ-06 (`search_logs`), HU-14.9 (`computeRatio`).
- **Bloquea a:** REQ-18 (observabilidad lee de la misma cache de KPIs).
- **Recursos compartidos:** binding KV (`env.KV`), `computeRatio` de HU-14.9.

## Riesgos tecnicos

- Riesgo: las 5 queries en paralelo pueden throttlear D1 → Mitigación: `Promise.all` con timeout de 2s por query; queries que exceden → KPI con `pending_data: true`.
- Riesgo: cache KV de 5 minutos durante deploy con migración → Mitigación: la invalidación manual con `force_refresh=1` se documenta en el runbook de deploy.
- Riesgo: `percentile_approx` no existe en SQLite/D1 → Mitigación: calcular manualmente con `ORDER BY latency_ms LIMIT 1 OFFSET (SELECT COUNT(*) * 0.95 FROM ...)` o aproximar via histograma (bucket count). Documentar la elección.
