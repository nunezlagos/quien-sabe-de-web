# Diseno tecnico — HU-08.4 — Métricas de contacto para el prestador

**REQ padre:** REQ-08-contacto-tracking

## Modelo de datos

Reutiliza `contact_events` de HU-08.1. No introduce tablas nuevas.

Consulta principal (pseudo SQL):

```
SELECT kind, DATE(created_at, 'unixepoch') AS day, COUNT(*) AS c
FROM contact_events
WHERE provider_id = :pid
  AND created_at >= :since   -- unixepoch hace 30 días
GROUP BY kind, day
ORDER BY day ASC;
```

Aprovecha índice `idx_contact_events_provider_date` (HU-08.1).

## Contrato de API

| Endpoint | Metodo | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/contact-metrics` | GET | sesión prestador | — | `{ total: number, by_kind: { whatsapp: number, phone: number, email: number }, last_30d_by_day: Array<{ day: string YYYY-MM-DD, count: number }> }` (length 30) | 401 (sin sesión), 403 (sesión no es prestador) |

## Validaciones Zod

```ts
// src/lib/validators/contacts.ts (pseudocodigo)
// Solo validamos query (vacía) y forma de respuesta para tests de contrato.
const contactMetricsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  by_kind: z.object({
    whatsapp: z.number().int().nonnegative(),
    phone: z.number().int().nonnegative(),
    email: z.number().int().nonnegative(),
  }),
  last_30d_by_day: z.array(z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    count: z.number().int().nonnegative(),
  })).length(30),
})
```

## Componentes UI

### Paginas Astro

- `src/pages/dashboard/provider.astro` (existirá en REQ-12) — consumirá este endpoint o lo invocará en SSR.
- Mockup base: `mockups/dashboard-provider.html:65-95`.

### Componentes Astro reutilizables

- `src/components/dashboard/ContactsKpi.astro` — card grande con número total y delta vs 30 días previos.
  - Mockup base: `mockups/dashboard-provider.html:83-86`.
  - Islas requeridas: no (render server-side con datos del endpoint).
- `src/components/dashboard/ContactsByDayChart.astro` — sparkline/barras simples (UI a diseñar siguiendo el estilo de `mockups/dashboard-admin.html:117-142`).
  - Islas requeridas: opcional, si se quiere interactividad de hover.

## Flujo de interaccion (secuencial)

1. Prestador carga `/dashboard/provider` (REQ-12).
2. La página invoca `GET /api/v1/providers/me/contact-metrics` (SSR fetch o desde isla).
3. Handler en `src/pages/api/v1/providers/me/contact-metrics.ts`:
   a. Lee `Astro.locals.session`. Si no hay → 401.
   b. Si la sesión no es de un prestador → 403.
   c. Calcula `since = nowSec - 30*86400`.
   d. Consulta `contact_events` agrupando por `kind` y por día.
   e. Rellena los 30 días con `0` donde no haya datos.
   f. Devuelve JSON 200.
4. UI renderiza KPI `mockups/dashboard-provider.html:83-86` con `total`.

## Capa de servicios

- `src/lib/services/contact-events.ts`:
  - `getProviderContactMetrics(env, providerId, sinceSec, untilSec): Promise<{ total, byKind, byDay }>` — invoca Drizzle, aplica zero-fill de 30 días.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/contact-events.test.ts` | Zero-fill de días sin eventos, agrupación por kind |
| Integracion | `tests/integration/contacts/metrics-provider.test.ts` | 200 con forma correcta, 401 sin sesión, 403 si no es prestador, exclusión de eventos > 30 días, aislamiento por provider |

## Dependencias y secuencia

- **Bloqueado por:** HU-08.1 (tabla), HU-08.2 (datos reales para tests de integración), REQ-07 (`session` con `providerId`).
- **Bloquea a:** REQ-12 (dashboard prestador completo).
- **Recursos compartidos:** binding D1, `Astro.locals.session`.

## Riesgos tecnicos

- Riesgo: zonas horarias (Chile UTC-3/-4) producen agrupación por día incorrecta → Mitigación: documentar que el agrupamiento es UTC; ofrecer offset en query string si se requiere localmente (fuera del scope inmediato).
- Riesgo: prestador sin eventos recibe array vacío → Mitigación: zero-fill garantiza `length = 30`.
- Riesgo: sesión válida pero `providerId` nulo (rol vecino) → Mitigación: chequeo explícito antes de query; responder 403.
- Riesgo: query lenta si tabla crece → Mitigación: índice ya cubre filtro; medir y, si supera 50 ms p95, cachear en KV con TTL 60s.
