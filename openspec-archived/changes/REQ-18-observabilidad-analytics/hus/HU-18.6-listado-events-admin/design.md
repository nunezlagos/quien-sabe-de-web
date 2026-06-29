# Diseño técnico — HU-18.6 — Tabla paginada de eventos para debug

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

Sin schema nuevo. Lectura paginada sobre `events_log` (HU-18.1) con `ORDER BY created_at DESC, id DESC` y cursor opaco `base64({createdAt, id})`.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/analytics/events` | GET | sesión + `role='admin'` | query: `event?`, `from?`, `to?`, `limit?` (1-200, default 50), `cursor?`, `format?` (`json`\|`csv`, default `json`) | si `format=json`: `{ "rows": [...], "next_cursor": <string\|null> }`; si `format=csv`: body `text/csv` con headers `event,actor_role,props_json,created_at` | 400 (filtros inválidos), 401, 403, 500 |

Cada fila JSON:

```
{
  "id": "<ulid>",
  "event": "signup",
  "actor_role": "anonymous",
  "props_json": "{...}",
  "created_at": "2026-06-09T12:00:00.000Z"
}
```

CSV: encabezado `event,actor_role,props_json,created_at` (sin `id` por simplicidad de debug rápido; `props_json` entrecomillado escapando comillas internas).

## Validaciones Zod

```ts
// src/lib/validators/admin/events-list.ts (pseudocódigo)
const EVENT_ENUM = z.enum(['signup','search','contact','review','donation','ticket_open'])

export const listEventsQuery = z.object({
  event: EVENT_ENUM.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  format: z.enum(['json','csv']).default('json'),
}).refine(v => !v.from || !v.to || v.from <= v.to, {
  message: 'from debe ser <= to',
})
```

## Componentes UI

### Páginas Astro

- `src/pages/dashboard-admin.astro` — añadir sección `events-section` con su nav-link en sidebar.
- Mockup base: `mockups/dashboard-admin.html:148-185` (patrón de "Mantenedor Usuarios").

### Componentes Astro reutilizables

- `src/components/admin/EventsTable.astro` — tabla principal.
  - Mockup base: `mockups/dashboard-admin.html:149-184` (header + `overflow-x-auto` + `<table>`).
  - Props: `{ rows, nextCursor, currentFilters }`.
  - Islas requeridas: sí. Isla `client:load` para cambios de filtro y paginación.

- `src/components/admin/EventsFilters.astro` — controles de filtro.
  - Mockup base: `mockups/dashboard-admin.html:111-114` (patrón select compacto) más inputs de fecha.
  - Props: `{ value, onChange }`.
  - Islas requeridas: sí (forman parte de la isla de la tabla).

- `src/components/admin/EventsExportButton.astro` — botón "Export CSV" en el header.
  - Mockup base: `mockups/dashboard-admin.html:151` (botón verde primary con ícono).
  - UI a diseñar siguiendo este estilo (mismo tamaño, mismo radio, ícono `ri-download-line`).
  - Props: `{ filters }` — construye query y dispara descarga.

## Flujo de interacción (secuencial)

1. Admin entra a `/dashboard-admin#events`.
2. SSR carga la primera página con `limit=50` y sin filtros.
3. Usuario cambia filtro `event` en el select (`mockups/dashboard-admin.html:111` patrón).
4. La isla hace `fetch('/api/v1/admin/analytics/events?event=signup&limit=50')` y re-renderiza filas.
5. Usuario hace scroll/click "Cargar más" → la isla llama con `cursor=<next_cursor>`.
6. Usuario hace click en `EventsExportButton` → navegador descarga `/api/v1/admin/analytics/events?...&format=csv` con `Content-Disposition: attachment`.

## Capa de servicios

- `src/lib/services/analytics/events-list.service.ts` — pseudocódigo:
  - `listEvents(env, filters): Promise<{ rows: EventRow[]; nextCursor: string | null }>`
  - `toCsv(rows: EventRow[]): string` — escapa comillas y comas, incluye BOM UTF-8 opcional.
  - `decodeCursor(s: string): { createdAt: number; id: string } | null`
  - `encodeCursor(row: EventRow): string`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/analytics/events-list.test.ts` | `toCsv` escapa correctamente; encode/decode de cursor son inversos; `listEvents` aplica WHERE y ORDER esperados. |
| Integración | `tests/integration/admin/events-list.test.ts` | GET con `event=signup&limit=50` → 50 filas correctas; rango `from/to` acota; `format=csv` retorna `text/csv` con header esperado; sin sesión → 401; no-admin → 403; filtros inválidos → 400. |
| E2E | `tests/e2e/admin-events.spec.ts` | Login admin → ver tabla → cambiar filtro → exportar CSV → archivo descargado con contenido esperado. |

## Dependencias y secuencia

- **Bloqueado por:** HU-18.1 (tabla + índice `(event, created_at desc)`), HU-18.3 (datos reales para tener algo que listar).
- **Bloquea a:** ninguna.
- **Recursos compartidos:** página `dashboard-admin.astro`, sidebar, binding `DB`.

## Riesgos técnicos

- Export CSV sin paginar puede romper Worker bajo dataset grande → cap a 10.000 filas o exigir rango ≤ 30 días.
- Cursor opaco basado en `(createdAt, id)` requiere índice secundario por `id` para tie-break → el índice de HU-18.1 `(event, created_at DESC)` no cubre tie-break por `id`; aceptable porque `id` ULID es monótono y colisiones por timestamp son raras.
- `props_json` largo puede inflar el CSV → cap por columna o truncado con `...` documentado.
- Inyección via filtros → Drizzle parametriza todo; Zod normaliza fechas.
