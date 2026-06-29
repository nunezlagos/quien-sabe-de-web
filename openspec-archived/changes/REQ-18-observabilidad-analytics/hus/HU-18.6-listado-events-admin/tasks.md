# HU-18.6 — Tabla paginada de eventos para debug

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.6-listado-events-admin`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/analytics/events-list.service.ts` con `listEvents(env, filters)`, `toCsv(rows)`, `decodeCursor`, `encodeCursor`.
- [ ] **T2** Validador `listEventsQuery` en `src/lib/validators/admin/events-list.ts` con refine `from <= to`. Cap CSV a 10.000 filas.
- [ ] **T3** Endpoint `src/pages/api/v1/admin/analytics/events.ts` (GET, sesión admin):
  - Parsea query con `listEventsQuery` → 400 si falla.
  - `listEvents` con cursor y filtros.
  - Si `format=csv` → `Content-Type: text/csv` + `Content-Disposition: attachment; filename="events-<timestamp>.csv"` + BOM UTF-8 opcional.
  - Headers `Cache-Control: no-store`.
- [ ] **T4** Componentes:
  - `src/components/admin/EventsTable.astro` con props `{rows, nextCursor, currentFilters}`. Mockup `mockups/dashboard-admin.html:149-184`. Isla `client:load` para filtros y paginación.
  - `src/components/admin/EventsFilters.astro` con props `{value, onChange}`. Mockup `mockups/dashboard-admin.html:111-114`. Isla.
  - `src/components/admin/EventsExportButton.astro` con prop `filters`. Construye query y dispara descarga. Mockup `mockups/dashboard-admin.html:151` estilo.
- [ ] **T5] Añadir nav-link "Eventos" en sidebar y sección `events-section` en `dashboard-admin.astro` bajo `#events`.
- [ ] **T6] Truncar `props_json` en el CSV con `...` documentado si excede 2000 chars (cap por columna).
- [ ] **T7] Tests:
  - [ ] `tests/unit/services/analytics/events-list.test.ts` — `toCsv` escapa correctamente (comillas, comas); encode/decode de cursor son inversos; `listEvents` aplica WHERE y ORDER esperados.
  - [ ] `tests/unit/validators/admin/events-list.test.ts` — refine `from <= to`, limit 1-200.
  - [ ] `tests/integration/admin/events-list.test.ts` — GET con `event=signup&limit=50` → 50 filas correctas; rango `from/to` acota; `format=csv` retorna `text/csv` con header esperado; sin sesión → 401; no-admin → 403; filtros inválidos → 400.
  - [ ] `tests/e2e/admin-events.spec.ts` — login admin → ver tabla → cambiar filtro → exportar CSV → archivo descargado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `toCsv`, no escapar comillas internas → parser downstream rompe, test unitario rojo → restaurar
- [ ] Sabotaje 2: invertir el ORDER BY a `ASC` → el admin ve filas más viejas primero, test integración rojo → restaurar
- [ ] Sabotaje 3: exportar CSV sin cap de filas → worker puede colgarse con dataset grande, test integración con cap rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/analytics/events-list.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: tabla paginada de eventos admin` y push