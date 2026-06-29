# Diseno tecnico — HU-08.5 — Métricas globales de contacto para admin

**REQ padre:** REQ-08-contacto-tracking

## Modelo de datos

Reutiliza `contact_events` (HU-08.1). Adicionalmente referencia (a futuro) la tabla `settings` para el target OE2.

Consulta principal (pseudo SQL para `range=ytd`):

```
SELECT kind, strftime('%Y-%m', created_at, 'unixepoch') AS yyyy_mm, COUNT(*) AS c
FROM contact_events
WHERE created_at >= :year_start_sec
GROUP BY kind, yyyy_mm
ORDER BY yyyy_mm ASC;
```

Total YTD = suma de `c`. `ytd_progress_vs_target = total_ytd / target_year_n`.

Tabla `settings` (a confirmar; si no existe aún, usar constante):

```ts
// src/lib/config/oe2-target.ts (pseudocodigo)
export const OE2_TARGETS = {
  year1: 5000,
  year2: 25000,
} as const
```

## Contrato de API

| Endpoint | Metodo | Auth | Query string | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/analytics/contacts` | GET | sesión admin | `?range=last_30d \| ytd \| all` (default `ytd`) | `{ total: number, by_kind: { whatsapp: number, phone: number, email: number }, by_month: Array<{ yyyy_mm: string, count: number }>, ytd_progress_vs_target: number (0..1+) }` | 401 (sin sesión), 403 (no admin), 400 (range inválido) |

## Validaciones Zod

```ts
// src/lib/validators/admin-analytics.ts (pseudocodigo)
const contactsAnalyticsQuerySchema = z.object({
  range: z.enum(['last_30d', 'ytd', 'all']).default('ytd'),
})

const contactsAnalyticsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  by_kind: z.object({
    whatsapp: z.number().int().nonnegative(),
    phone: z.number().int().nonnegative(),
    email: z.number().int().nonnegative(),
  }),
  by_month: z.array(z.object({
    yyyy_mm: z.string().regex(/^\d{4}-\d{2}$/),
    count: z.number().int().nonnegative(),
  })),
  ytd_progress_vs_target: z.number().nonnegative(),
})
```

## Componentes UI

### Paginas Astro

- `src/pages/dashboard/admin.astro` (REQ-13) — incluye el KPI nuevo dentro del grid existente.
- Mockup base: `mockups/dashboard-admin.html:67-105` (estructura del grid) y `mockups/dashboard-admin.html:107-143` (estilo del gráfico mensual).

### Componentes Astro reutilizables

- `src/components/admin/ContactsKpi.astro` — card de KPI con número total, target, y porcentaje de avance.
  - Mockup base: `mockups/dashboard-admin.html:69-77` (estructura visual del card).
  - Islas requeridas: no.
- `src/components/admin/ContactsByMonthChart.astro` — barras mensuales con tooltip al hover.
  - Mockup base: `mockups/dashboard-admin.html:117-142`.
  - Islas requeridas: opcional, solo si se quiere tooltip dinámico.

## Flujo de interaccion (secuencial)

1. Admin carga `/dashboard/admin`.
2. La página invoca `GET /api/v1/admin/analytics/contacts?range=ytd`.
3. Handler en `src/pages/api/v1/admin/analytics/contacts.ts`:
   a. Lee sesión; si no existe → 401. Si rol ≠ `admin` → 403.
   b. Parsea `range` con Zod; si inválido → 400.
   c. Calcula `sinceSec` según rango (last_30d, inicio del año, o sin filtro).
   d. Consulta agrupando por `kind` y `yyyy_mm`.
   e. Calcula `ytd_progress_vs_target = totalYearToDate / OE2_TARGETS.yearN` (selecciona año 1 o 2 según fecha).
   f. Devuelve JSON 200.
4. UI renderiza KPI en el card de `mockups/dashboard-admin.html:67-105` extendido.

## Capa de servicios

- `src/lib/services/contact-events.ts`:
  - `getGlobalContactMetrics(env, range: 'last_30d' | 'ytd' | 'all', nowSec: number): Promise<{ total, byKind, byMonth, ytdTotal }>`.
- `src/lib/config/oe2-target.ts`:
  - `getOe2TargetForYear(yearOffsetFromLaunch: number): number` — devuelve 5000 / 25000 / valor configurable.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/contact-events.test.ts` | Cálculo de `ytd_progress_vs_target` para distintos totales |
| Unit | `tests/unit/validators/admin-analytics.test.ts` | `range` válido/ inválido, default `ytd` |
| Integracion | `tests/integration/admin/contacts-metrics.test.ts` | 200 admin, 403 vecino, 401 anónimo, filtro `last_30d` reduce ventana, `by_month` ordenado |

## Dependencias y secuencia

- **Bloqueado por:** HU-08.1 (tabla), HU-08.2 (datos reales para tests), REQ-07 (sesión + rol admin).
- **Bloquea a:** REQ-13 (dashboard admin completo), REQ-18 (reportes).
- **Recursos compartidos:** binding D1, `Astro.locals.session`, eventualmente tabla `settings`.

## Riesgos tecnicos

- Riesgo: `strftime` con SQLite puede variar de motor → Mitigación: D1 usa SQLite estándar; verificar con test de integración.
- Riesgo: año 1 vs año 2 no está definido formalmente → Mitigación: documentar `LAUNCH_DATE` como constante; calcular `yearOffset = floor((now - launch) / 365 días)`.
- Riesgo: `range=all` puede devolver array enorme en `by_month` → Mitigación: limitar a últimos 24 meses si crece (mejora futura, fuera del scope inmediato).
- Riesgo: cache stale puede engañar al admin → Mitigación: NO cachear en esta HU (poco volumen de consulta); evaluar caché si p95 > 500 ms.
- Riesgo: división por cero si `target = 0` → Mitigación: clamp con `Math.max(target, 1)` o validar en `getOe2TargetForYear`.
