# Propuesta — HU-10.4 — Cola admin con filtros

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

Los administradores necesitan ver la cola de tickets con filtros por estado, tipo y asignado. La cola es la herramienta principal de la mesa de soporte; sin buenos filtros se vuelve inmanejable cuando hay >50 tickets. Esta HU introduce el endpoint `GET /api/v1/admin/tickets` con paginación por cursor y la sección Astro de la cola en el dashboard admin. El endpoint es exclusivo admin (sin permisos para vecinos).

## Mockups de referencia

- `mockups/dashboard-admin.html:225-264` — patrón de tabla admin con badges de estado y acciones.
- Mockup TBD para la sección específica de tickets (sigue este patrón).

## Alternativas consideradas

### Opcion A — Endpoint paginado por cursor + filtros + tabla admin
- `GET /api/v1/admin/tickets?status=&kind=&assignee=&limit=&cursor=`.
- Pro: consistencia con HU-07.4 (mismo patrón de cursor).
- Pro: filtros combinables.
- Contra: requiere múltiples WHERE dinámicos; SQL builder con cuidado.

### Opcion B — Endpoint con offset/limit y filtros
- Más simple.
- Contra: bajo volumen, aceptable; pero las reseñas y mensajes usan cursor en otras HUs.

### Opcion C — GraphQL con `@connection`
- Overkill para 1 query.

## Decision

Se elige **Opcion A**. Reutiliza el helper `encodeCursor/decodeCursor` de HU-07.4. El admin puede filtrar por `status`, `kind`, `assignee='me'|'unassigned'|adminId`. La respuesta es `{ items, cursor, total }`.

## Riesgos y mitigaciones

- Riesgo: filtros opcionales no se aplican correctamente cuando se combinan → Mitigación: tests exhaustivos de combinaciones (status+kind, kind+assignee, etc.).
- Riesgo: `assignee='me'` falla cuando el admin no tiene `userId` en sesión → Mitigación: validar `session.user.id`; 401 si no.
- Riesgo: el listado filtra soft-deleted providers pero los tickets quedan visibles → Mitigación: el listado no filtra por provider status; el admin debe ver el ticket aunque el provider esté soft-deleted (auditoría).
- Riesgo: orden inconsistente con `created_at` igual → Mitigación: tiebreaker `id DESC` (igual que reseñas).

## Metrica de exito

- 25 tickets seed, GET `?status=abierto&limit=10` → 10 items + cursor; segunda llamada con cursor → 5 items sin duplicados.
- GET `?kind=suplantacion&assignee=me` → sólo tickets suplantación asignados al admin actual.
- GET `?assignee=unassigned` → sólo tickets con `assignee_admin_id IS NULL`.
- GET sin sesión → 401.
- GET con sesión vecino/provider → 403.
- Filtro inválido (kind='rastreo') → 400.
