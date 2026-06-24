# Diseño técnico — HU-12.2 — Widgets de métricas (últimos 30 días)

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto, referencial — tablas existentes en REQ previos)
export const contactEvents = sqliteTable('contact_events', {
  // id, provider_id, user_id, channel, created_at
})

export const reviews = sqliteTable('reviews', {
  // id, provider_id, author_user_id, rating, status, created_at
})

export const profileViews = sqliteTable('profile_views', {
  // id, provider_id, session_hash, created_at  (asume HU previa, si no existe se documenta como prerequisito)
})
```

### Migración Drizzle

- Si `profile_views` no existe en el esquema actual, archivo objetivo: `src/database/migrations/NNNN_profile_views.sql`.
- Cambios: nueva tabla `profile_views` con índice `(provider_id, created_at)`.

(Si la tabla ya existe en migraciones previas del REQ-04, esta HU no genera migración.)

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/metrics` | GET | sesión prestador | (ninguno) | `{ views_30d: number, contacts_30d: number, rating_avg: number \| null, reviews_count: number, delta_vs_prev_30d: { views: number \| null, contacts: number \| null } }` | 401 (sin sesión), 403 (rol distinto), 500 |

## Validaciones Zod

```ts
// src/lib/validators/metrics.ts (pseudocódigo)
export const metricsResponseSchema = z.object({
  views_30d: z.number().int().nonnegative(),
  contacts_30d: z.number().int().nonnegative(),
  rating_avg: z.number().min(0).max(5).nullable(),
  reviews_count: z.number().int().nonnegative(),
  delta_vs_prev_30d: z.object({
    views: z.number().nullable(),
    contacts: z.number().nullable(),
  }),
})
```

## Componentes UI

### Páginas Astro

- Sin página nueva. Se monta como sección dentro de `src/pages/dashboard-provider.astro` (HU-12.1).

### Componentes Astro reutilizables

- `src/components/dashboard/provider/MetricsWidgets.astro` — props: `metrics: MetricsResponse | null`. Renderiza el grid de 4 tarjetas.
  - Mockup base: `mockups/dashboard-provider.html:78-95`.
  - Islas requeridas: sí (`client:visible`) para fetch del endpoint en cliente o hidratación tras SSR.
- `src/components/dashboard/provider/MetricCard.astro` — props: `value: string | number`, `label: string`, `accent?: 'primary' | 'yellow' | 'blue' | 'gray'`, `delta?: number | null`.
  - Mockup base: `mockups/dashboard-provider.html:79-94`.
  - Islas requeridas: no.

## Flujo de interacción (secuencial)

1. SSR de `dashboard-provider.astro` ya tiene la sesión (HU-12.1).
2. El servidor realiza `GET /api/v1/providers/me/metrics` internamente o el componente isla hace `fetch` en hidratación.
3. Servidor valida sesión y rol, ejecuta 3 queries Drizzle: vistas 30d, contactos 30d, agregados de reseñas; calcula deltas vs ventana previa.
4. UI mapea respuesta a las 4 `MetricCard` del grid (`mockups/dashboard-provider.html:79-94`).
5. Si el delta existe, se muestra junto al número (ej.: `+20%`). Si es `null`, se omite.

## Capa de servicios

- `src/lib/services/metrics.service.ts`:
  - `getProviderMetrics(env, providerId): Promise<MetricsResponse>` — orquesta los agregados.
  - `computeDelta(current: number, previous: number): number | null` — pura: si `previous === 0` retorna `null`.
  - `windowRanges(now: Date): { current: [Date, Date], previous: [Date, Date] }` — pura, devuelve dos ventanas de 30 días en UTC.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/metrics/delta.test.ts` | `computeDelta` con casos `prev=0`, deltas positivos, negativos, cero. |
| Unit | `tests/unit/metrics/window-ranges.test.ts` | Cálculo de ventanas en UTC y bordes (cambio de mes). |
| Integración | `tests/integration/providers/metrics.test.ts` | Endpoint responde con datos agregados, excluye eventos antiguos, otro prestador no ve métricas ajenas, sin sesión 401. |
| E2E | `tests/e2e/dashboard-provider-metrics.spec.ts` | Las 4 tarjetas renderizan valores del backend tras carga. |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1 (layout que aloja el componente), REQ-03 (`contact_events`), REQ-09 (`reviews`), REQ-04 (vistas de perfil si aplica).
- **Bloquea a:** HU-12.5 reutiliza el `rating_avg` y `reviews_count`.
- **Recursos compartidos:** binding `DB`, tabla `profile_views` (si se introduce aquí).

## Riesgos técnicos

- Riesgo: índices faltantes en `contact_events(provider_id, created_at)` y `reviews(provider_id)`. Mitigación: validar índices en la migración correspondiente; añadir si faltan.
- Riesgo: `rating_avg` calculado on-the-fly puede divergir del cacheado en `providers.rating`. Mitigación: usar la query como fuente de verdad y, si existe `providers.rating`, sincronizar en un trigger/job futuro.
- Riesgo: caché HTTP del navegador entrega valores viejos. Mitigación: respuesta con `Cache-Control: private, max-age=60`.
