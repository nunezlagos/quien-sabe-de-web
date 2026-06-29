# REQ-13-dashboard-admin

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1, OE3

## Descripción

Panel admin para operar la plataforma: métricas globales, CRUD de usuarios
(banear / cambiar rol), taxonomía de oficios, vista de finanzas (donaciones
vs costos para OE3), cola de verificaciones (REQ-03), cola de tickets
(REQ-10) y settings globales.

## Criterios de éxito

- [ ] Sólo usuarios con rol admin acceden a `/dashboard-admin` (middleware estricto).
- [ ] CRUD de oficios (taxonomía) con drag & drop de orden.
- [ ] Listado paginado de usuarios con filtros (rol, status).
- [ ] Vista de finanzas con ratio donaciones / costos (OE3).
- [ ] Settings globales editables (rate-limits, SLAs, mensajes legales).
- [ ] Auditoría de cambios admin (quién, cuándo, qué).

## Superficie técnica

### Endpoints API
- `GET    /api/v1/admin/users` — listado paginado [admin]
- `PATCH  /api/v1/admin/users/:id` — actualizar (rol, status) [admin]
- `GET    /api/v1/admin/trades` — listar oficios [admin]
- `POST   /api/v1/admin/trades` — crear oficio [admin]
- `PATCH  /api/v1/admin/trades/:id` — editar [admin]
- `DELETE /api/v1/admin/trades/:id` — eliminar (si sin uso) [admin]
- `GET    /api/v1/admin/finances/summary` — agregado donaciones/gastos [admin]
- `GET    /api/v1/admin/settings` — leer settings [admin]
- `PATCH  /api/v1/admin/settings` — actualizar settings [admin]
- `GET    /api/v1/admin/audit-log` — auditoría [admin]

### Vistas Astro
- `/dashboard-admin` (secciones: resumen, usuarios, oficios, verificaciones, tickets, finanzas, settings, auditoría)
  - **Tickets:** cola de tickets (REQ-10) con filtros por estado y prioridad
  - **Verificaciones:** cola de verificaciones pendientes (REQ-03) con acciones aprobar/rechazar
  - **Auditoría:** log de acciones admin con filtros por usuario, fecha y tipo de acción

### Tablas Drizzle
- Lectura/escritura sobre `users`, `trades`, `donations`, `expenses`, `settings`, `admin_audit_log`

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-13.1 | middleware-admin | Guard de rol estricto + auditoría | P0 |
| HU-13.2 | lista-usuarios-crud | Listado + ban + cambio rol | P0 |
| HU-13.3 | taxonomia-oficios | CRUD trades + reorder | P0 |
| HU-13.4 | resumen-metricas | Widgets globales | P0 |
| HU-13.5 | finanzas-admin | Donaciones / costos / ratio OE3 | P1 |
| HU-13.6 | settings-globales | Form + validaciones | P1 |
| HU-13.7 | auditoria-admin | Log de acciones admin | P0 |

## Tests requeridos

- **Unit:** validador Zod de settings, helper de auditoría.
- **Integración:** middleware bloquea no-admins, eliminar oficio en uso → 409, cambio de rol auditado.
- **E2E:** admin crea oficio → aparece en taxonomía → prestador lo selecciona en perfil.

## Dependencias

- **Depende de:** REQ-01, REQ-03, REQ-10, REQ-14
- **Habilita a:** REQ-15, REQ-18

## Riesgos / suposiciones

- Acciones destructivas (eliminar usuario) requieren confirmación + auditoría obligatoria.
- Settings impactan toda la app: cache invalidation explícito.
