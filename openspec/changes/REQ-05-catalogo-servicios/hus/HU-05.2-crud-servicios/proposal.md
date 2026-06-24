# Propuesta — HU-05.2 — CRUD de servicios del prestador

**Estado:** propuesta | **REQ padre:** REQ-05-catalogo-servicios

## Contexto

Una vez que `services` existe (HU-05.1), el prestador autenticado
necesita crear, listar, editar y eliminar los servicios de su perfil.
El endpoint de listado debe estar ordenado por `sort_order` asc para
que el orden manual (drag-drop de HU-05.4) sea visible. La edición
debe negar acceso a servicios de otro prestador (403). El `sort_order`
del nuevo servicio se calcula como `MAX(sort_order) + 1` para que
quede al final.

## Mockups de referencia

- `mockups/dashboard-provider.html:198-225` — sección "Mis Servicios Activos" con dos servicios (`$15.000`, `$25.000`), botones de editar (`ri-pencil-line`) y borrar (`ri-delete-bin-line`). El layout y el handler de cada acción se derivan de acá.
- `mockups/create-trade.html:50-100` — form de "Contacto y Precios" (WhatsApp, Precio Base). Los campos del formulario de creación de servicio replican este patrón.

## Alternativas consideradas

### Opcion A — Endpoints REST `GET/POST /api/v1/providers/me/services` y `PATCH/DELETE /api/v1/providers/me/services/[id]`
- Mismo patrón que HU-04.2 (`/me` + Zod).
- Pro: simétrico con HU-04.2; consistencia de la API.
- Pro: el ownership check es trivial: `services.provider_id → providers.user_id → session.userId`.
- Contra: dos archivos de endpoint.

### Opcion B — Endpoint único `/api/v1/providers/me/services` con método HTTP como discriminador + query `?id=X`
- Un solo archivo, dispatch por método.
- Pro: menos archivos.
- Contra: menos idiomático REST, dificulta OpenAPI, complica cache HTTP.

### Opcion C — GraphQL
- Schema único `service(id, providerId, ...)` con mutations.
- Pro: cliente pide lo que necesita.
- Contra: introduce un stack paralelo (Apollo/etc) que el proyecto no usa; rompe homogeneidad.

## Decision

Se elige **Opcion A**. Consistencia con HU-04.2; trivial para el
equipo que ya tocó esa HU; el ownership check se reduce a un `WHERE
services.id = ? AND services.provider_id = (SELECT id FROM providers
WHERE user_id = ?)` — una sola query.

## Riesgos y mitigaciones

- Riesgo: race en `MAX(sort_order) + 1` cuando dos POST concurrentes del mismo prestador → Mitigación: D1 serializa writes por sesión; documentar el comportamiento y agregar test con POSTs secuenciales (no concurrentes — fuera de scope de esta HU).
- Riesgo: edición de `title` no normalizada (espacios dobles, mayúsculas) → Mitigación: normalizador `normalizeTitle(raw)` (trim + colapsar espacios + capitalize) en el servicio.
- Riesgo: edición de servicio ajeno (otro prestador) mediante path manipulation → Mitigación: el handler verifica ownership con la subquery descrita arriba; test verifica 403.
- Riesgo: DELETE físico de un servicio cascade borra `service_coverage` correctamente pero pierde histórico si se quisiera auditar → Mitigación: por ahora es OK (REQ-09 reseñas referencia a `providers`, no a `services`); documentar como decisión.

## Metrica de exito

- `POST /api/v1/providers/me/services` con body válido → 201; segundo servicio → `sort_order=1`.
- `GET /api/v1/providers/me/services` → array ordenado por `sort_order` asc.
- `PATCH /api/v1/providers/me/services/7` con `{"price_clp": 50000}` → 200, fila actualizada.
- `PATCH /api/v1/providers/me/services/<id-de-otro-prestador>` → 403.
- `DELETE /api/v1/providers/me/services/7` → 204, fila no existe.
