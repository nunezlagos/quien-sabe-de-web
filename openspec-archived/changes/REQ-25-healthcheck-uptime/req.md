# REQ-25-healthcheck-uptime

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Endpoints internos `/health` y `/ready` para monitoreo externo. Incluye
verificación de bindings críticos (D1, KV, R2, SES) con timeouts cortos
y reporte de latencia. Configuración de UptimeRobot o similar contra
`/health` con alertas a Discord/email del equipo.

## Criterios de éxito

- [ ] `GET /api/v1/health` responde con p95 < 200ms.
- [ ] Reporta latencia de cada binding y estado global `ok | degraded | down`.
- [ ] `GET /api/v1/ready` distingue "iniciado" de "puede recibir tráfico".
- [ ] UptimeRobot configurado con check cada 5 min y alerta < 2 fallos.

## UI

N/A — endpoint interno consumido por monitoreo.

## Superficie técnica

### Endpoints API
- `GET /api/v1/health` — público, sin auth
- `GET /api/v1/ready` — público

### Tablas Drizzle
- Ninguna (lectura ping).

### Bindings Cloudflare
- `D1`, `SESSION` (KV), `BUCKET` (R2), `SES` (probe no-op en HU-25.1)

### Códigos HTTP
- `200 OK` cuando `status` es `ok` o `degraded` (servicio responde, sólo algún binding degradado).
- `503 Service Unavailable` cuando `status` es `down` (D1 caído o múltiples bindings caídos); útil para que UptimeRobot lo distinga del 200.

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-25.1 | endpoint-health | GET /health con bindings + latencias | P0 |
| HU-25.2 | endpoint-readiness | GET /ready para deploys | P1 |
| HU-25.3 | integracion-monitoring-externo | UptimeRobot + alertas | P1 |

## Tests requeridos

- **Unit:** helper `checkBinding(name, fn, timeoutMs)` con timeouts.
- **Integración:** simular D1 caído → status `degraded`; KV ok → componente ok.
- **E2E:** curl al endpoint en staging y verificar JSON estructurado.

## Dependencias

- **Depende de:** —
- **Habilita a:** REQ-26, REQ-18

## Riesgos / suposiciones

- Worker no expone disk/CPU stats; sólo latencias de I/O.
- Endpoint público pero sin información sensible.
