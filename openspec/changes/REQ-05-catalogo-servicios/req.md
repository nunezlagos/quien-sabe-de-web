# REQ-05-catalogo-servicios

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Catálogo de servicios ofrecidos por un prestador. Cada servicio: título,
descripción, tarifa (CLP) con unidad (hora/visita/proyecto), zona de cobertura
(comunas alcanzables) y disponibilidad horaria.

## Criterios de éxito

- [ ] Prestador puede tener N servicios bajo su perfil.
- [ ] Cada servicio expone tarifa visible públicamente o "consultar".
- [ ] Orden manual (drag & drop) persiste.
- [ ] Zona de cobertura permite seleccionar varias comunas.
- [ ] Servicios desactivados no aparecen en búsqueda.

## Superficie técnica

### Endpoints API
- `GET    /api/v1/providers/me/services` — listar [sesión prestador]
- `POST   /api/v1/providers/me/services` — crear [sesión prestador]
- `PATCH  /api/v1/providers/me/services/:id` — editar [sesión prestador]
- `DELETE /api/v1/providers/me/services/:id` — eliminar [sesión prestador]
- `POST   /api/v1/providers/me/services/reorder` — reordenar [sesión prestador]

### Vistas Astro
- `/dashboard-provider` (sección servicios)

### Tablas Drizzle
- `services` (id, provider_id, title, description, price_clp, unit, sort_order, status)
- `service_coverage` (service_id, commune_id)

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-05.1 | schema-services | Tablas + migración | P0 |
| HU-05.2 | crud-servicios | Endpoints + Zod | P0 |
| HU-05.3 | cobertura-comunas | Multi-select de comunas | P1 |
| HU-05.4 | reorder-drag-drop | Persist sort_order | P2 |
| HU-05.5 | toggle-disponibilidad | Activar/desactivar | P1 |

## Tests requeridos

- **Unit:** Zod schema (precio > 0, unidad enum), normalizador de título.
- **Integración:** CRUD, reorder atómico, intento de editar servicio ajeno (403).
- **E2E:** prestador crea 3 servicios → reordena → desactiva uno → vecino busca y sólo ve los activos.

## Dependencias

- **Depende de:** REQ-04
- **Habilita a:** REQ-06, REQ-07

## Riesgos / suposiciones

- Moneda inicial sólo CLP. Multi-moneda fuera de scope.
- Servicios sin precio visible se marcan "Consultar" (no oculto, distinto).
