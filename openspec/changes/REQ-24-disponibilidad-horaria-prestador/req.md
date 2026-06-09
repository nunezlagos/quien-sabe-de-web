# REQ-24-disponibilidad-horaria-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

El prestador declara su disponibilidad semanal (día + rango horario) y el
sistema expone un indicador "Disponible ahora" en el perfil público y un
filtro en el buscador. Incluye zona horaria America/Santiago.

## Criterios de éxito

- [ ] Prestador define hasta N rangos por día de la semana.
- [ ] Backend calcula `is_available_now` en tiempo de respuesta.
- [ ] Filtro `available_now=true` en buscador (extiende REQ-06).
- [ ] Indicador visible en `/p/:slug`.

## UI pendiente

No existe en ningún mockup. **Tarea explícita previa a implementación:
diseñar mockup de la sección "Disponibilidad" en `dashboard-provider.html`
(grid semanal de días con rangos horarios) y badge "Disponible ahora" en
`profile.html` header.** Mientras tanto, reutilizar pattern visual del
form de edición visto en `mockups/dashboard-provider.html:135-194` (cards
`bg-white rounded-3xl shadow-sm border border-gray-100 p-8`).

## Superficie técnica

### Endpoints API
- `GET   /api/v1/providers/:id/availability` — público
- `PUT   /api/v1/providers/me/availability` — reemplaza arreglo [sesión]
- `GET   /api/v1/search?available_now=true` — extensión REQ-06

### Vistas Astro
- `/dashboard-provider` (sección Disponibilidad nueva).
- `/p/:slug` (badge).

### Tablas Drizzle
- `provider_availability (provider_id, day_of_week 0-6, start_time, end_time)`
  con UNIQUE `(provider_id, day_of_week, start_time)`.

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-24.1 | schema-availability | Tabla + migración | P0 |
| HU-24.2 | crud-horario-prestador | Endpoints + UI dashboard | P0 |
| HU-24.3 | indicador-disponible-ahora-publico | Cálculo + badge | P1 |
| HU-24.4 | filtro-disponible-en-buscador | Query param en /search | P1 |

## Tests requeridos

- **Unit:** función `isAvailableNow(ranges, now, tz)` con casos en límites.
- **Integración:** PUT reemplaza atomicamente; búsqueda filtra correctamente.
- **E2E:** prestador define horario lunes 9-13 → fixture `now=lunes 10:00`
  → badge "Disponible".

## Dependencias

- **Depende de:** REQ-04
- **Habilita a:** REQ-06 (extensión), REQ-07

## Riesgos / suposiciones

- Workers no tiene Intl.DateTimeFormat con tz arbitraria en runtime estable;
  fallback con offset fijo Chile (-3 o -4 con horario verano).
- Disponibilidad no implica compromiso contractual; sólo señal informativa.
