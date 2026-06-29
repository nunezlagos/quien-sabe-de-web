# Diseno tecnico — HU-10.4 — Cola admin con filtros

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

No introduce tablas. Lee de `tickets` (HU-10.1).

Query SQL (pseudo):

```sql
SELECT t.id, t.kind, t.status, t.assignee_admin_id, t.target_provider_id,
       t.created_by_user_id, t.contact_email, t.created_at
FROM tickets t
WHERE (:status IS NULL OR t.status = :status)
  AND (:kind IS NULL OR t.kind = :kind)
  AND (:assignee_mode = 'all'
       OR (:assignee_mode = 'me' AND t.assignee_admin_id = :current_admin_id)
       OR (:assignee_mode = 'unassigned' AND t.assignee_admin_id IS NULL)
       OR (:assignee_mode = 'specific' AND t.assignee_admin_id = :specific_admin_id))
  AND (:cursor_ts IS NULL OR (t.created_at, t.id) < (:cursor_ts, :cursor_id))
ORDER BY t.created_at DESC, t.id DESC
LIMIT :limit + 1;
```

Total:

```sql
SELECT COUNT(*) FROM tickets
WHERE ... (mismos filtros, sin cursor ni limit);
```

## Contrato de API

| Endpoint | Método | Auth | Query | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/tickets` | GET | sesión admin | `status?: 'abierto'\|'en_revision'\|'cerrado'`, `kind?: 'suplantacion'\|'mal_servicio'\|'contenido'\|'consulta'`, `assignee?: 'me'\|'unassigned'\|<adminId>`, `limit?: 1..50`, `cursor?: base64url` | `{ items: Ticket[], cursor: string\|null, total: number }` | 401, 403, 400 (filtro inválido) |

DTO `Ticket`:

```ts
type Ticket = {
  id: number;
  kind: TicketKind;
  status: TicketStatus;
  assigneeAdminId: number | null;
  targetProviderId: number | null;
  createdByUserId: number | null;
  contactEmail: string | null;
  createdAt: string; // ISO
};
```

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (extender)
export const ticketsListQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  kind: ticketKindSchema.optional(),
  assignee: z.string().optional(), // 'me' | 'unassigned' | numeric adminId
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
```

## Componentes UI

### Endpoint

- `src/pages/api/v1/admin/tickets.ts` (GET).

### Componente Astro

- `src/components/admin/TicketsQueue.astro`:
  - Render inicial server-side (lista).
  - Filtros como `<select>` + `<input>` para assigneeId. Submit recarga la página con query string (SSR; sin SPA).
  - Tabla con columnas: ID, Tipo, Estado (badge), Asignado (avatar+iniciales o "Sin asignar"), Prestador target (link), Solicitante, Creado (relative time).
  - Click en fila → link a `/dashboard/admin#ticket/<id>` (vista detalle se materializa en HU futura).

## Flujo de interaccion (secuencial)

1. Admin navega a `/dashboard/admin?tickets=1` (anchor `#tickets` muestra la sección).
2. SSR invoca `listTicketsForAdmin(env, filters)` y pasa items al componente.
3. UI renderiza tabla con filtros como form GET (no JS).
4. Cambio de filtro → submit recarga con nuevos query params.

## Capa de servicios

- `src/lib/services/tickets.ts`:
  - `listTicketsForAdmin(env, filters: { status?, kind?, assignee?, limit, cursor? }, currentAdminId): Promise<{ items, cursor, total }>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/tickets.test.ts` (extender) | `ticketsListQuerySchema`: filtros opcionales OK; kind inválido falla; limit 0 falla; limit 51 falla |
| Unit | `tests/unit/services/tickets.test.ts` (extender) | `listTicketsForAdmin` con cada combinación de filtros; cursor present + 1 fila extra → `nextCursor` correcto; sin extras → `nextCursor=null` |
| Integración | `tests/integration/admin/tickets-list.test.ts` | 25 tickets seed; `?status=abierto&limit=10` → 10 + cursor; segunda llamada → 5 sin overlap; `?kind=suplantacion` filtra; `?assignee=me` filtra por admin actual; `?assignee=unassigned` filtra NULL; vecino → 403; sin sesión → 401; kind inválido → 400 |

## Dependencias y secuencia

- **Bloqueado por:** HU-10.1 (schema), HU-07.4 (helper de cursor reutilizable).
- **Bloquea a:** HU-10.5 (transiciones operan sobre tickets listados).
- **Recursos compartidos:** `encodeCursor/decodeCursor` (HU-07.4).

## Riesgos tecnicos

- Riesgo: SQL dinámico con muchos `IS NULL OR =` se vuelve lento → Mitigación: índice compuesto `(status, kind, created_at DESC, id DESC)` si el volumen crece; fuera de scope inmediato.
- Riesgo: el orden por `(created_at, id)` requiere ambos DESC → Mitigación: índice cubre; EXPLAIN verifica.
- Riesgo: filtros `assignee=123` (adminId) podrían ser SQL injection si no se valida → Mitigación: Zod `assignee` parsea como `z.string().regex(/^(me|unassigned|\d+)$/)`; en TS convertir a número con `Number()` después de validar.
- Riesgo: el componente Astro recarga la página completa en cada cambio de filtro → Mitigación: aceptable para uso admin; performance OK con 100 tickets.
