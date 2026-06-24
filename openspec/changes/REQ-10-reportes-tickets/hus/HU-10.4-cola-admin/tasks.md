# HU-10.4 — Cola admin con filtros

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.4-cola-admin`

## Tareas técnicas

- [ ] **T1** Validador `ticketsListQuerySchema` en `src/lib/validators/tickets.ts` con regex para `assignee: 'me'|'unassigned'|<num>`.
- [ ] **T2** Helper `parseAssigneeFilter(raw: string, currentAdminId: number): 'all' | 'me' | 'unassigned' | number` en `src/lib/services/tickets.ts`.
- [ ] **T3** Servicio `listTicketsForAdmin(env, filters, currentAdminId)`:
  - Construir WHERE dinámicamente con Drizzle.
  - Aplicar `LIMIT :limit + 1`; si hay extra → `nextCursor = encodeCursor(lastItem.createdAt, lastItem.id)`.
  - Query de `total` con mismos filtros (sin cursor/limit).
  - Retornar `{ items, cursor, total }`.
- [ ] **T4** Endpoint `src/pages/api/v1/admin/tickets.ts` (GET):
  - `requireAdmin(Astro)` → 401 / 403.
  - Parsear query con `ticketsListQuerySchema` → 400.
  - `listTicketsForAdmin(env, filters, session.user.id)`.
  - `successResponse(result, 200)`.
- [ ] **T5** Componente `src/components/admin/TicketsQueue.astro`:
  - Props: `tickets: Ticket[]`, `total: number`, `currentFilters: object`.
  - Form GET con `<select name="status">`, `<select name="kind">`, `<input name="assignee">`, `<input name="limit" value="20">`, botón "Filtrar".
  - Tabla con columnas (ID, Tipo, Estado, Asignado, Target, Solicitante, Creado).
  - Estado como `<span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">abierto</span>`.
  - Asignado: si NULL → "Sin asignar"; si adminId → nombre del admin (JOIN opcional; simplificación: mostrar "Admin #<id>" en MVP).
  - Link "Ver detalle" en cada fila (anchor a futura vista detalle).
- [ ] **T6** Integrar `<TicketsQueue>` en `src/pages/dashboard/admin.astro` (REQ-13, stub si no existe) bajo `<section id="tickets-section">`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/validators/tickets.test.ts` (extender) — `ticketsListQuerySchema`: filtros opcionales OK; kind='rastreo' falla; limit=0 falla; limit=51 falla.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `parseAssigneeFilter`: 'me' con adminId=5 → 'me'; 'unassigned' → 'unassigned'; '5' → 5; 'abc' → throw.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `listTicketsForAdmin` con cada filtro; con LIMIT+1 hay extra → cursor presente.
  - [ ] `tests/integration/admin/tickets-list.test.ts` — 25 tickets seed; combinaciones de filtros; cursor flow sin overlap; vecino → 403; sin sesión → 401; filtros inválidos → 400.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: olvidar el `+1` en el LIMIT → test "nextCursor presente cuando hay más" cae → restaurar
- [ ] Sabotaje 2: en `parseAssigneeFilter`, no validar `abc` y retornar `'all'` silencioso → test "assignee='abc' → throw" cae → restaurar
- [ ] Sabotaje 3: invertir el orden de `created_at DESC` (usar ASC) → test "orden consistente (DESC)" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets.ts` (rama list)
- [ ] Type check verde
- [ ] Commit `feat: cola admin de tickets con filtros + paginación cursor` y push
