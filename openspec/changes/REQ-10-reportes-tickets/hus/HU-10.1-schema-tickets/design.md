# Diseno tecnico — HU-10.1 — Schema tickets + ticket_messages

**REQ padre:** REQ-10-reportes-tickets

## Modelo de datos

### Tablas Drizzle (pseudocodigo)

```ts
// src/database/schema.ts (extracto)
export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['suplantacion', 'mal_servicio', 'contenido', 'consulta'] }).notNull(),
  status: text('status', { enum: ['abierto', 'en_revision', 'cerrado'] }).notNull().default('abierto'),
  assigneeAdminId: integer('assignee_admin_id').references(() => users.id, { onDelete: 'set null' }),
  targetProviderId: integer('target_provider_id').references(() => providers.id, { onDelete: 'cascade' }),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  contactEmail: text('contact_email'), // para tickets anónimos
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  byStatusCreated: index('idx_tickets_status_created').on(t.status, t.createdAt),
  byAssignee: index('idx_tickets_assignee').on(t.assigneeAdminId),
  byKind: index('idx_tickets_kind').on(t.kind),
}));

export const ticketMessages = sqliteTable('ticket_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  sender: text('sender', { enum: ['author', 'admin', 'system'] }).notNull(),
  body: text('body').notNull(),
  internalNote: integer('internal_note', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (t) => ({
  byTicketPublic: index('idx_ticket_messages_ticket_public').on(t.ticketId, t.internalNote, t.createdAt),
}));
```

### Migracion Drizzle

Archivo: `src/database/migrations/00XX_tickets.sql`:

- `CREATE TABLE tickets (...)` con:
  - `CHECK (kind IN ('suplantacion','mal_servicio','contenido','consulta'))`
  - `CHECK (status IN ('abierto','en_revision','cerrado'))`
  - `CHECK (length(subject) BETWEEN 5 AND 150)` (constraint extra; sujeto se almacena en `tickets` o normalizado a primer mensaje — decisión en HU-10.2)
  - FKs según arriba
- `CREATE TABLE ticket_messages (...)` con:
  - `CHECK (length(body) BETWEEN 1 AND 5000)`
  - FK a `tickets(id) ON DELETE CASCADE`
- Índices según `byStatusCreated`, `byAssignee`, `byKind`, `byTicketPublic`.

## Contrato de API

No aplica. HU 100% backend (DDL). Las HUs siguientes exponen endpoints sobre este schema.

## Validaciones Zod

```ts
// src/lib/validators/tickets.ts (firmas)
export const ticketKindSchema = z.enum(['suplantacion', 'mal_servicio', 'contenido', 'consulta']);
export const ticketStatusSchema = z.enum(['abierto', 'en_revision', 'cerrado']);
export const ticketSenderSchema = z.enum(['author', 'admin', 'system']);

// usado por HU-10.2 y HU-10.3
export const ticketCreateSchema = z.object({
  kind: ticketKindSchema,
  subject: z.string().min(5).max(150),
  body: z.string().min(1).max(5000),
  targetProviderId: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
}).refine(
  (v) => v.kind === 'consulta' || v.targetProviderId !== undefined,
  { message: 'target_provider_id requerido para kind != consulta', path: ['targetProviderId'] }
).refine(
  (v) => v.kind === 'consulta' || v.contactEmail === undefined,
  { message: 'contact_email no permitido para kind != consulta', path: ['contactEmail'] }
);
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. Editar `src/database/schema.ts` agregando `tickets` y `ticketMessages`.
2. `docker exec quien-sabe-app bun run db:generate`.
3. Editar SQL para agregar CHECKs manualmente.
4. `docker exec quien-sabe-app bun run db:migrate:local`.
5. HUs 10.2-10.7 consumen vía Drizzle.

## Capa de servicios

Stub en `src/lib/services/tickets.ts` (firmas, no implementaciones):

- `createTicket(env, input, session?): Promise<Ticket>`.
- `listTicketsForAdmin(env, filters, cursor?): Promise<...>`.
- `getTicketById(env, id, session?): Promise<Ticket | null>`.
- `transitionTicket(env, id, targetStatus, adminId): Promise<Ticket>`.
- `addMessage(env, ticketId, sender, body, internalNote): Promise<TicketMessage>`.
- `listMessages(env, ticketId, isAdmin): Promise<TicketMessage[]>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/tickets/schema.test.ts` | Migración crea tablas; CHECK status rechaza 'otro'; CHECK kind rechaza 'rastreo'; FK a users falla con id inexistente; FK a providers CASCADE borra tickets al borrar provider; SET NULL mantiene ticket al borrar admin |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (users), REQ-04 (providers).
- **Bloquea a:** HU-10.2, HU-10.3, HU-10.4, HU-10.5, HU-10.6, HU-10.7.
- **Recursos compartidos:** binding D1, `src/database/schema.ts`.

## Riesgos tecnicos

- Riesgo: `drizzle-kit` no emite CHECKs → Mitigación: editar la migración SQL manualmente (patrón HU-08.1, HU-09.1).
- Riesgo: FK con `ON DELETE CASCADE` a `providers` borra tickets al soft-delete del provider → Mitigación: el soft-delete cambia `status='deleted'` pero no borra la fila; la FK sólo aplica al `DELETE FROM providers`, no a UPDATE. Aceptable.
- Riesgo: índice `(ticket_id, internal_note, created_at)` no se usa cuando `internal_note` no está en WHERE → Mitigación: documentar; la query principal de HU-10.6 SIEMPRE filtra por ambos.
- Riesgo: el stub de servicios crea expectativas falsas → Mitigación: usar `throw new Error('not implemented yet')` en cada firma; los tests de esta HU sólo validan schema.
