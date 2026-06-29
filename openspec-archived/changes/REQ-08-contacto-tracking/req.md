# REQ-08-contacto-tracking

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE2

## Descripción

Botones de contacto (WhatsApp `wa.me/`, mailto, llamada) emiten un evento
"contacto efectivo" antes de salir al destino. El evento alimenta la métrica
de OE2 (5.000 / 25.000 contactos efectivos año 1 / año 2). No se guarda PII
del solicitante: sólo provider_id, kind, timestamp, ip-hash, ua-hash.

## Criterios de éxito

- [ ] Click en botón WhatsApp registra evento ANTES de redirigir.
- [ ] Si el tracking falla, el redirect no se bloquea (fire-and-forget con `navigator.sendBeacon`).
- [ ] Contador agregado por prestador disponible en su dashboard (REQ-12).
- [ ] Métricas globales disponibles en admin (REQ-13).
- [ ] No se guardan datos personales del solicitante.

## Superficie técnica

### Endpoints API
- `POST /api/v1/contacts/track` — body: `{ provider_id, kind }` [público, rate-limited por IP]
- `GET  /api/v1/providers/me/contact-metrics` — agregado propio [sesión prestador]

### Vistas Astro
- Integrado en `/p/:slug`, `/profile`, cards de búsqueda

### Tablas Drizzle
- `contact_events` (id, provider_id, kind, ip_hash, ua_hash, created_at)

### Bindings Cloudflare
- `D1`, rate limit via `KV`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-08.1 | schema-contact-events | Tabla + índices | P0 |
| HU-08.2 | endpoint-track | POST con rate limit | P0 |
| HU-08.3 | client-sendbeacon | Wire botones con sendBeacon antes de href | P0 |
| HU-08.4 | metricas-prestador | Agregado por provider para dashboard | P1 |
| HU-08.5 | metricas-admin | Agregado global | P1 |

## Tests requeridos

- **Unit:** hasher de IP/UA, schema Zod.
- **Integración:** rate limit funcional (N requests → 429), POST sin sesión OK, agregados correctos.
- **E2E:** click WhatsApp dispara request + abre `wa.me/`; click email dispara request + abre `mailto:`.

## Dependencias

- **Depende de:** REQ-07
- **Habilita a:** REQ-12, REQ-13, REQ-18

## Riesgos / suposiciones

- IP-hash con salt rotativo mensual (cumple Ley 19.628 — datos no reversibles).
- Rate limit base: 30 contactos/hora por IP-hash.
