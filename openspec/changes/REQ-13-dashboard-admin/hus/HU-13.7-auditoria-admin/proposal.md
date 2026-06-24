# Propuesta — HU-13.7 — Log de auditoría de acciones admin

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

Toda acción admin (ban, role change, settings update, oficio CRUD, finanzas action) debe quedar registrada con: quién, cuándo, qué entidad, qué cambió (before/after). La trazabilidad es requisito legal (Ley 19.628 sobre protección de datos personales: el admin debe poder demostrar qué datos modificó). Proponemos una tabla `admin_audit_log` append-only con snapshot before/after en JSON, y un helper `logAdminAction()` único usado por todas las HUs de REQ-13. El endpoint admin de lectura es paginado y filtrable por actor y entidad.

## Mockups de referencia

No hay mockup específico. El estilo visual replica la tabla de `mockups/dashboard-admin.html:147-186` (Mantenedor Usuarios) pero adaptada para mostrar `actor` + `action` + `entity` + `created_at` + botón "Ver diff".

## Alternativas considered

### Opcion A — Tabla `admin_audit_log` con `before_json` y `after_json` snapshots
- Una fila por acción. Snapshots completos.
- Pro: reconstructible: el supervisor ve exactamente qué tenía el registro antes y después.
- Pro: simple de consultar y filtrar.
- Contra: ocupa espacio; un update de un campo grande duplica el row en JSON.

### Opcion B — Tabla `admin_audit_log` con `diff` (sólo campos cambiados) en vez de snapshots
- Pro: menos espacio.
- Contra: requiere reconstruir el diff en cada lectura; pierde el contexto completo.

### Opcion C — Logs estructurados en KV/logpush en vez de tabla SQL
- Pro: cero esquema.
- Contra: sin queries SQL (filtros, joins); latencia de búsqueda mayor.

## Decision

Se elige **Opcion A**. Snapshots completos dan tranquilidad legal y operacional. La compresión/archivado de filas >12 meses queda para REQ-18. El helper `logAdminAction` se invoca desde TODAS las HUs de REQ-13 (13.1, 13.2, 13.3, 13.6, 13.8).

## Riesgos y mitigaciones

- Riesgo: la tabla crece rápido (cada admin write = 1 fila) → Mitigación: archivado mensual (job en REQ-18) + índices en `actor_id`, `entity`, `created_at`.
- Riesgo: snapshots contienen PII (email de usuario baneado) → Mitigación: aceptable; el admin DEBE ver el PII para reconstruir la auditoría; el acceso al log es admin-only.
- Riesgo: el INSERT de audit falla después del UPDATE real → Mitigación: ejecutar el INSERT en la misma transacción; si falla, hacer rollback del cambio. Para acciones con side-effects externos (ban con invalidación KV), auditar primero y actuar después es inviable; aceptamos el riesgo acotado y logueamos warnings.

## Metrica de exito

- GET `/api/v1/admin/audit-log?limit=50` → 50 últimas acciones ordenadas desc.
- GET `?actor_id=3&entity=users` → sólo las del actor 3 sobre `users`.
- Cada acción admin (PATCH user, POST trade, PATCH settings) genera 1 fila en `admin_audit_log`.
- E2E: admin ejecuta 3 acciones → log muestra 3 filas con timestamps correctos.
