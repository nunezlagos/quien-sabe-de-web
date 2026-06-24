# Propuesta — HU-12.4 — Sección de gestión de servicios inline

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita listar, crear, editar y activar/desactivar sus servicios sin abandonar el dashboard. Centralizar la operación reduce fricción y sostiene OE1. Reutiliza endpoints de REQ-05 sin redefinir contrato.

## Mockups de referencia

- `mockups/dashboard-provider.html:198-226` — sección "Mis Servicios Activos" con CTA "Agregar Nuevo" (`#add-service-btn`) y lista de servicios con precio y acciones (editar, eliminar).
- `mockups/dashboard-provider.html:204-225` — patrón de ítem: nombre, precio en CLP formateado, botones circulares editar/eliminar.
- `mockups/dashboard-provider.html:470-508` — modal "Nuevo Servicio" con campos Nombre, Precio (Referencial), Descripción.
- `mockups/dashboard-provider.html:560-567` — lógica JS de apertura/cierre del modal.

## Alternativas consideradas

### Opcion A — Modal para crear/editar + lista inline
- Lista directa en la sección; CRUD via modal compartido con modo `create` / `edit`.
- Pro: coincide con mockup (`mockups/dashboard-provider.html:470-508`), evita scroll en formularios largos.
- Contra: requiere lógica adicional para alternar modo del modal.

### Opcion B — Edición inline en la propia fila
- Click en editar transforma la fila en formulario en el sitio.
- Pro: cero modales, edición rápida.
- Contra: mockup no lo respalda, mayor complejidad de estado por fila.

## Decision

Se adopta **Opcion A** porque el mockup define explícitamente un modal con `#service-modal` (`mockups/dashboard-provider.html:471`) y la diferenciación entre alta/edición es trivial reusando un mismo formulario con título dinámico (`service-modal-title`). El toggle activo/inactivo se maneja con un control adicional en la fila.

## Riesgos y mitigaciones

- Riesgo: borrado accidental de servicio sin confirmación. Mitigación: confirm modal o estado `confirming` antes de `DELETE`.
- Riesgo: lista grande de servicios degrada rendimiento. Mitigación: paginación o virtual scroll en una HU futura; el mockup actual asume ≤ 20.
- Riesgo: estado `Activo` no está en el mockup actual. Mitigación: añadir toggle al lado del botón eliminar siguiendo el patrón del sidebar (`mockups/dashboard-provider.html:51-55`).

## Metrica de exito

- Crear, editar y eliminar un servicio se refleja en la lista sin recargar página completa (optimismo + reconciliación con servidor).
- Toggle activo/inactivo persiste y el servicio inactivo se ve atenuado.
- Otro prestador no puede tocar servicios ajenos (test de integración con sesión cruzada).
