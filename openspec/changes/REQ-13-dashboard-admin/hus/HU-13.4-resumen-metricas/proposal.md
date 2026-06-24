# Propuesta — HU-13.4 — Widgets de métricas globales (KPIs)

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

El admin necesita ver de un vistazo si la plataforma está cumpliendo OE1 (registros), OE2 (contactos) y OE3 (ratio donaciones/costos). Proponemos un endpoint único `GET /api/v1/admin/analytics/kpis` que devuelve los 5 KPIs acordados y un cache KV de 5 minutos para evitar recalcular en cada render del dashboard. Los KPIs vienen de consultas agregadas a las tablas ya existentes (no introducimos tablas nuevas).

## Mockups de referencia

- `mockups/dashboard-admin.html:67-105` — sección "Dashboard" con 4 KPIs en grid (Usuarios Totales, Oficios Activos, Valoración Media, Solicitudes). Replicamos la grilla pero la ampliamos a 5 KPIs para incluir el ratio OE3.
- `mockups/dashboard-admin.html:107-143` — chart "Visitas Semanales". Out of scope para esta HU (queda para HU-18.x si se requiere series temporales).

## Alternativas considered

### Opcion A — Endpoint único `/api/v1/admin/analytics/kpis` con cache KV 5 min y cálculo on-miss
- Una sola ruta que devuelve `{ signups_30d, contacts_30d, ratio_donations_costs, p95_ms_search, precision_search }`.
- Pro: una llamada por render; fácil de cachear; fácil de invalidar.
- Contra: el cálculo on-miss ejecuta 5 queries (puede ser lento si las tablas son grandes).

### Opcion B — Endpoint por KPI (`/kpis/signups`, `/kpis/contacts`, etc.)
- Pro: caché granular.
- Contra: el dashboard hace N requests al render; complica el cliente sin beneficio observable.

### Opcion C — Materialized view en D1 refrescada cada 5 min por cron
- Pro: queries instantáneas.
- Contra: D1 no soporta materialized views nativas; habría que simular con tabla `kpis_snapshot`. Aceptable pero requiere un cron (REQ-18). Decidimos empezar con cache KV y dejar la materialización para cuando duela.

## Decision

Se elige **Opcion A**. Cache KV `kpis:global` con TTL 300s, key incluye timestamp del cálculo para invalidación manual si el admin quiere forzar refresh (botón "refrescar" en UI). Si el cálculo on-miss excede 2s, logueamos warning y seguimos adelante (mejor KPIs lentos que dashboard roto).

## Riesgos y mitigaciones

- Riesgo: cache stale de 5 min esconde caída real de la plataforma → Mitigación: aceptable; el admin puede forzar refresh manual; los eventos críticos (donación, ban) invalidan el cache vía setting `kpis_cache_ttl_seconds` (REQ-13.6).
- Riesgo: query de `ratio_donations_costs` depende de HU-14.x no deployada → Mitigación: el KPI devuelve `null` con flag `pending_data: true` si las tablas `donations` o `expenses` no existen; no rompe el dashboard.
- Riesgo: `precision_search` requiere logs de búsqueda (REQ-06) no siempre presentes → Mitigación: mismo patrón — devuelve `null` con flag.

## Metrica de exito

- GET `/api/v1/admin/analytics/kpis` (admin) → 200 con shape completo.
- Sin admin → 403.
- Segunda llamada en <5 min → cache hit (response <50ms con header `X-Cache: HIT`).
- Cálculo on-miss → 5 queries (verificable en logs).
- E2E: admin entra al dashboard → ve 5 KPIs con valores > 0 tras seed.
