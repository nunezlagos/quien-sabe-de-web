# Propuesta — HU-05.4 — Reordenar servicios con drag and drop

**Estado:** propuesta | **REQ padre:** REQ-05-catalogo-servicios

## Contexto

El prestador quiere priorizar sus servicios más importantes (los que
más le interesan o los más rentables) mostrándolos primero. La sección
de servicios del dashboard debe permitir arrastrar y soltar (drag &
drop) y persistir el nuevo orden. La HU define el endpoint
`POST /api/v1/providers/me/services/reorder` y el componente
accesible del dashboard. La persistencia debe ser atómica: o se
reordena todo, o nada.

## Mockups de referencia

- `mockups/dashboard-provider.html:198-225` — sección "Mis Servicios Activos" donde se monta el componente reorderable. El mockup actual muestra una lista estática con botones; el componente reemplazará esos items por handles drag (`ri-draggable` o similar).

## Alternativas consideradas

### Opcion A — Endpoint `POST /api/v1/providers/me/services/reorder` con `{"order":[id1,id2,...]}` + transacción Drizzle que actualiza `sort_order` de todas las filas en una sola pasada
- Cliente envía el array completo en el nuevo orden (no incremental).
- Server valida: (a) array incluye exactamente todos los servicios del prestador, (b) todos los IDs son propios.
- `db.transaction` con `UPDATE ... CASE WHEN id = ? THEN ? END` o N updates.
- Pro: atómico.
- Pro: server es la fuente de verdad para "qué IDs son válidos" — cliente no puede enviar IDs arbitrarios.
- Contra: si el prestador tiene 50 servicios, el array pesa.

### Opcion B — Endpoint incremental `PATCH /api/v1/providers/me/services/[id] { sort_order: 3 }`
- Mover un servicio a la posición 3.
- Pro: payload chico.
- Contra: requiere recalcular `sort_order` del resto para no tener colisiones; race conditions; el cliente tiene que conocer el orden actual antes de mover.

### Opcion C — Drag-drop sin persistencia inmediata (sólo en sesión) + "Guardar orden" al final
- Front mantiene el orden en estado local; al click "Guardar", envía el array final.
- Pro: UX más natural (no spamea requests).
- Contra: si el usuario cierra la pestaña sin guardar, pierde el orden. Para esta HU aceptable como decisión UX.

## Decision

Se elige **Opcion A** para el endpoint, y **Opcion C** como patrón UX
del componente. El frontend usa la librería `@atlaskit/pragmatic-drag-drop`
o `SortableJS` (a definir en la implementación), mantiene el orden
local y al confirmar envía el array completo a
`POST /services/reorder`. La decisión UX es reversible sin cambiar
el contrato del endpoint.

## Riesgos y mitigaciones

- Riesgo: drag-drop inaccesible para usuarios con discapacidad motriz o que navegan con teclado → Mitigación: el componente expone también flechas arriba/abajo (`ri-arrow-up-line`, `ri-arrow-down-line`) que emiten el mismo reorder; accesibilidad WCAG 2.1 AA.
- Riesgo: drag-drop no funciona en mobile táctil → Mitigación: librería debe soportar pointer events; verificación manual con Playwright en viewport móvil.
- Riesgo: array incompleto (faltan IDs) → Mitigación: server valida que `order.length === servicesByProvider.length && new Set(order).size === order.length` → 422 si no.
- Riesgo: ID de otro prestador en el array → Mitigación: server hace `WHERE id IN (?) AND provider_id = ?` y compara count → 403 si no coincide.

## Metrica de exito

- 3 servicios con `sort_order [0,1,2]`. `POST /reorder` con `[9,7,8]` → 200; `sort_order` queda `9→0, 7→1, 8→2`.
- Reorder con id ajeno → 403, `sort_order` intacto.
- Reorder con array incompleto (`order:[7]` para 3 servicios) → 422 con `{ error: "debe incluir todos los servicios" }`.
- E2E: arrastrar el último item al primero → recarga de página → el nuevo orden persiste.
