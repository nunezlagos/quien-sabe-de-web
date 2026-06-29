# Propuesta — HU-18.6 — Tabla paginada de eventos para debug

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

Cuando un KPI parece raro o un usuario reporta un flujo, el admin necesita inspeccionar los eventos crudos sin abrir la base. Esta HU añade una tabla paginada con filtros (`event`, rango temporal) y export CSV dentro del panel admin, manteniendo el patrón visual del mockup.

## Mockups de referencia

- `mockups/dashboard-admin.html:148-185` — patrón de tabla admin "Mantenedor Usuarios" con `<table class="w-full text-left text-sm">`, header `bg-gray-50 text-gray-400 text-xs uppercase font-bold`, body `divide-y divide-gray-100 hover:bg-gray-50`. Se reutiliza tal cual para `EventsTable`.
- `mockups/dashboard-admin.html:149-152` — header de tabla con título, ícono primario y botón de acción (aquí se reemplaza por "Export CSV").
- `mockups/dashboard-admin.html:153` — `overflow-x-auto` para responsive.
- `mockups/dashboard-admin.html:111-114` — select de período usable como filtro de rango temporal.

## Alternativas consideradas

### Opción A — Endpoint con filtros + render CSV server-side, tabla SSR + isla para filtros y paginación
- Endpoint único `/api/v1/admin/analytics/events` que acepta `event`, `from`, `to`, `limit`, `cursor`, `format=json|csv`. La página SSR-rendea la primera página; una isla maneja cambios de filtro vía `fetch`.
- Pro: cubre los 3 Gherkin (filtro por `event`, rango temporal, export CSV) con un solo endpoint.
- Contra: render CSV en el Worker debe ser cuidadoso con cadenas largas → streaming opcional.

### Opción B — Dos endpoints separados (JSON list y CSV export)
- `/events` para JSON, `/events.csv` para export.
- Pro: separación de responsabilidades.
- Contra: duplica validación de filtros y autenticación; el Gherkin admite un solo endpoint con `format=csv`.

### Opción C — Sólo tabla cliente sin paginación (cargar todo)
- Fetch único sin paginar.
- Contra: con retención 90 días la tabla puede tener cientos de miles de filas; viola la noción de paginado del REQ.

## Decisión

Se adopta **Opción A**. Un endpoint con `format` cumple los Gherkin, comparte validación y rate-limit/sesión. Render CSV streaming opcional si la tabla crece. Paginación por cursor (`created_at desc, id`) aprovecha el índice ya planeado en HU-18.1.

## Riesgos y mitigaciones

- Export CSV sobre rango amplio puede agotar memoria del Worker → cap por defecto a 10.000 filas y exigir rango temporal acotado o aviso.
- Filtros por rango fechas inválidos → Zod los normaliza a UTC y valida `from ≤ to`.
- Acceso no-admin → middleware existente del proyecto verifica `role='admin'` antes del handler.
- Datos sensibles en `props_json` (no debería haber, pero red de seguridad) → la sanitización ya ocurrió en HU-18.3; aquí no se re-procesa.

## Métrica de éxito

- Admin entra a la sección "Events", aplica filtro `event=signup`, ve los últimos 50.
- Cambiar `from` y `to` acota la lista correctamente.
- Click en "Export CSV" descarga un archivo `text/csv` con headers `event, actor_role, props_json, created_at`.
- Tests integración verdes en los 3 Gherkin.
