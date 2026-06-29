# Propuesta — HU-13.2 — Listado de usuarios con ban y cambio de rol

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

El admin debe poder operar la lista de usuarios: banear cuentas problemáticas, cambiar roles, restaurar usuarios suspendidos. Toda mutación debe quedar auditada (HU-13.7) y un ban debe invalidar las sesiones activas del usuario baneado en KV para que no pueda seguir navegando aunque su cookie siga viva. La propuesta cubre los endpoints `GET /api/v1/admin/users` (listado paginado con filtros), `PATCH /api/v1/admin/users/:id` (update con validación de auto-ban) y la UI de tabla con acciones inline.

## Mockups de referencia

- `mockups/dashboard-admin.html:147-186` — sección "Mantenedor Usuarios" con tabla (Nombre, Rol, Estado, Acciones). La columna Acciones tiene botones editar (azul) y borrar (rojo). Replicamos este patrón visual, reemplazando "borrar" por "banear/desbanear" según estado actual (semánticamente más claro para un sistema de cuentas).
- `mockups/dashboard-admin.html:288-342` — modal "Nuevo Usuario". El modal de edición/admin del HU reusa la estructura visual (backdrop blur, header gris, grid 2 columnas).

## Alternativas considered

### Opcion A — `GET` listado paginado + `PATCH :id` para update con invalidación KV
- Un endpoint GET con filtros (`role`, `status`, `limit`, `cursor`) + un endpoint PATCH por usuario. Acciones destructivas (ban) auditadas.
- Pro: contrato REST familiar; PATCH cubre update parcial sin obligar a DELETE separado.
- Contra: ban no es update puro (cambia estado y revoca sesiones); algunos lo modelan como acción separada.

### Opcion B — Endpoints dedicados por acción: `POST /admin/users/:id/ban`, `POST /admin/users/:id/role`
- Acciones modeladas como sub-recursos.
- Pro: cada acción es idempotente y audit-loggable por separado.
- Contra: explosión de endpoints para acciones que en realidad son updates de campos.

### Opcion C — GraphQL con mutations
- No encaja con el stack Astro del proyecto; introduce una capa entera.

## Decision

Se elige **Opcion A**. El PATCH acepta `role`, `status`, o ambos, y ejecuta side effects (invalidar KV) según corresponda. El body Zod valida que `role` esté en enum y `status` en enum, y rechaza `status: 'banned'` si `targetUserId === actorId` con 409.

## Riesgos y mitigaciones

- Riesgo: invalidar sesiones en KV pero la cookie del usuario sigue viva → Mitigación: además de borrar la key en KV, marcar un flag global `users.kv_invalidated_at` que el middleware chequea al resolver sesión.
- Riesgo: el admin se autobannea y queda fuera del sistema → Mitigación: validación 409 si `targetUserId === actorUserId && (status === 'banned' || role !== 'admin')`.
- Riesgo: listado paginado expone emails de usuarios baneados → Mitigación: aceptable para admin (necesita ver para restaurar); documento en `admin_audit_log` que el listado fue consultado.

## Metrica de exito

- GET `/api/v1/admin/users?role=prestador&status=active&limit=20` → 20 items + cursor.
- PATCH `/api/v1/admin/users/<otherId>` con `{"status":"banned"}` → 200, fila `users.status = 'banned'`, sesiones KV borradas, fila en `admin_audit_log`.
- PATCH `/api/v1/admin/users/<actorId>` con `{"status":"banned"}` → 409.
- E2E: admin banea prestador → prestador intenta login → 403.
