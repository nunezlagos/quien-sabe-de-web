# REQ-18-observabilidad-analytics

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1, OE2, OE3

## Descripción

Observabilidad de producto: eventos clave (signup, search, contact,
donation, ticket_open) emitidos a Cloudflare Analytics Engine + tabla
`events_log` para agregaciones internas. Dashboard interno con KPIs
vinculados directamente a OE1/OE2/OE3.

## Criterios de éxito

- [ ] 6 eventos base instrumentados: `signup`, `search`, `contact`, `review`, `donation`, `ticket_open`.
- [ ] Cada evento incluye `event_id`, `timestamp`, `actor_role`, `props` (json).
- [ ] Dashboard admin muestra KPIs en tiempo cuasi-real (≤ 5 min).
- [ ] KPIs ligados a OE: % p95 < 500 ms (OE1), precisión búsqueda (OE2), ratio donaciones (OE3).
- [ ] Sin PII en payloads.

## Superficie técnica

### Endpoints API
- `POST /api/v1/events/track` — emit desde cliente [público + rate-limit]
- `GET  /api/v1/admin/analytics/kpis` — KPIs agregados [admin]
- `GET  /api/v1/admin/analytics/events` — listado paginado [admin]

### Vistas Astro
- `/dashboard-admin#analytics`

### Tablas Drizzle
- `events_log` (id, event, actor_role, props_json, created_at)

### Bindings Cloudflare
- `D1`, Cloudflare Analytics Engine (binding `ANALYTICS`)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-18.1 | schema-events-log | Tabla + índices | P0 |
| HU-18.2 | tracker-cliente | Helper `track(event, props)` cliente | P0 |
| HU-18.3 | endpoint-track | POST con rate-limit | P0 |
| HU-18.4 | analytics-engine-emit | Doble emisión a CF Analytics Engine | P1 |
| HU-18.5 | dashboard-kpis | Widgets KPI vs targets OE | P1 |
| HU-18.6 | listado-events-admin | Tabla paginada para debug | P2 |

## Tests requeridos

- **Unit:** validador Zod del payload (props sin PII), normalizador de event names.
- **Integración:** track sin sesión OK, rate-limit aplica, agregaciones correctas en fixture.
- **E2E:** acción del usuario (búsqueda) → evento aparece en `/dashboard-admin#analytics` en <60s.

## Dependencias

- **Depende de:** REQ-13
- **Habilita a:** medición de OE1, OE2, OE3 (cierre del ciclo)

## Riesgos / suposiciones

- Cloudflare Analytics Engine en algunos planes es feature limitada; fallback queda en `events_log` D1.
- Volumen de eventos puede crecer: política de retención (ej. 90 días en D1).
