# REQ-12-dashboard-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Panel privado del rol prestador. Resumen de métricas (vistas, contactos
recibidos, rating promedio), edición de perfil, gestión de servicios, vista
de reseñas recibidas con opción de respuesta, abrir ticket de soporte y
preview público.

## Criterios de éxito

- [ ] Tras login del prestador, redirect a `/dashboard-provider`.
- [ ] Resumen de métricas con widgets (últimos 30 días).
- [ ] Tabs: Resumen, Perfil, Servicios, Reseñas.
- [ ] Preview público abre en modal/iframe sin abandonar dashboard.
- [ ] Botón soporte abre formulario de ticket (REQ-10).
- [ ] Banner visible si verificación pendiente o rechazada.

## Superficie técnica

### Endpoints API
- `GET /api/v1/providers/me/metrics` — métricas 30 días [sesión prestador]
- `GET /api/v1/providers/me/reviews` — reseñas recibidas [sesión prestador]
- (Reuso REQ-04, REQ-05, REQ-09 response)

### Vistas Astro
- `/dashboard-provider`

### Tablas Drizzle
- Agregados sobre `contact_events`, `reviews`, `providers`

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-12.1 | layout-dashboard-prestador | Layout sidebar + tabs | P0 |
| HU-12.2 | widgets-metricas | Vistas / contactos / rating últimos 30d | P0 |
| HU-12.3 | seccion-perfil-edicion | Reuso form REQ-04 inline | P0 |
| HU-12.4 | seccion-servicios | Reuso CRUD REQ-05 inline | P0 |
| HU-12.5 | seccion-resenas-respuesta | Listado + responder | P1 |
| HU-12.6 | banner-verificacion | Estado de verificación visible | P0 |
| HU-12.7 | preview-publico-modal | iframe a `/p/:slug` | P1 |

## Tests requeridos

- **Unit:** cálculos de delta (vs 30 días previos), formateador de rating.
- **Integración:** métricas excluyen contactos antiguos, otro prestador no puede ver datos ajenos.
- **E2E:** prestador edita servicio → métricas actualizan → preview muestra cambio.

## Dependencias

- **Depende de:** REQ-04, REQ-05, REQ-09
- **Habilita a:** —

## Riesgos / suposiciones

- Métricas precomputadas en una vista materializada si las queries crecen.
