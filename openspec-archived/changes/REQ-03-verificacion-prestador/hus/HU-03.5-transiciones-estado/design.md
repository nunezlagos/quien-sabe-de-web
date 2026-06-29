# Diseno tecnico — HU-03.5 — Aprobar / rechazar con auditoría y email

**REQ padre:** REQ-03-verificacion-prestador

## Modelo de datos

### Nueva tabla `adminAuditLog`

```ts
// src/database/schema.ts (extracto)
export const adminAuditLog = sqliteTable('admin_audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorId: integer('actor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  action: text('action').notNull(),  // 'verification.approved' | 'verification.rejected' | ...
  entityType: text('entity_type').notNull(),  // 'provider_verification'
  entityId: integer('entity_id').notNull(),
  before: text('before', { mode: 'json' }).$type<Record<string, unknown>>(),
  after: text('after', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  byActor: index('idx_admin_audit_actor').on(t.actorId),
  byEntity: index('idx_admin_audit_entity').on(t.entityType, t.entityId),
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0009_admin_audit_log.sql`.
- Cambios:
  - `CREATE TABLE admin_audit_log (...)` con FK a `users` con `ON DELETE RESTRICT` (no queremos perder audit trail si se borra un admin).

## Contrato de API

### `PATCH /api/v1/admin/verifications/:id` [admin]

Request:
```json
{ "status": "verificado" }
```
o
```json
{ "status": "rechazado", "rejection_reason": "documento ilegible" }
```

Response 200:
```json
{
  "id": 42,
  "status": "verificado",
  "reviewed_by": 1,
  "reviewed_at": 1716000500
}
```

Errores: 403 (no admin), 404 (no existe), 409 (transición inválida), 422 (`rejection_reason` faltante si `status='rechazado'`).

## Validaciones Zod

```ts
// src/lib/validators/admin.ts (extendido)
export const TransitionVerificationBody = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verificado') }),
  z.object({
    status: z.literal('rechazado'),
    rejection_reason: z.string().min(10).max(500),
  }),
])
```

## Componentes UI

No aplica nueva vista. La sección de HU-03.4 se extiende con modal "Rechazar" que pide `rejection_reason` antes de llamar PATCH.

## Flujo de interaccion (secuencial)

1. Admin hace click "Aprobar" o "Rechazar" en `/dashboard-admin#verifications`.
2. Si rechazar → modal pide motivo (textarea, mínimo 10 chars).
3. Frontend `PATCH /api/v1/admin/verifications/42` con body.
4. Backend:
   a. `requireAdmin(locals)` → 403 si no.
   b. `TransitionVerificationBody.parse(await request.json())` → 422 si falla.
   c. Carga fila actual. Si `id` no existe → 404.
   d. `canTransition(currentStatus, newStatus)` → si false → 409.
   e. `UPDATE provider_verifications SET status = ?, reviewed_by = ?, reviewed_at = unixepoch(), rejection_reason = ? WHERE id = ? AND status = 'pendiente'`. Si affected === 0 → 409 (race).
   f. `INSERT INTO admin_audit_log (actor_id, action, entity_type, entity_id, before, after)`.
   g. Enqueue email: `emailService.enqueue('verification_approved' | 'verification_rejected', { provider_email, ... })`. Best-effort; no bloquea la response.
   h. Return 200 con la fila actualizada.

## Capa de servicios

```ts
// src/lib/services/verification/stateMachine.ts
export const VERIFICATION_STATES = ['pendiente', 'verificado', 'rechazado'] as const
export type VerificationStatus = typeof VERIFICATION_STATES[number]

const ALLOWED_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  pendiente: ['verificado', 'rechazado'],
  verificado: [],
  rechazado: [],
}

export function canTransition(from: VerificationStatus, to: VerificationStatus): boolean

// src/lib/services/admin/audit.ts
export async function recordAudit(db, actorId: number, action: string, entityType: string, entityId: number, before: unknown, after: unknown): Promise<void>

// src/lib/services/admin/verifications.ts (extendido con transition)
export async function transitionVerification(env, db, actorId, verificationId, body): Promise<VerificationView>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/verification/state-machine.test.ts` | `canTransition('pendiente','verificado')` true; `canTransition('verificado','pendiente')` false; `canTransition('rechazado','verificado')` false; `canTransition('pendiente','rechazado')` true |
| Unit | `tests/unit/validators/admin-transition.test.ts` | Zod acepta `verificado` sin `rejection_reason`; rechaza `rechazado` sin motivo; motivo < 10 chars → fail |
| Integracion | `tests/integration/admin/verifications-transition.test.ts` | aprobar → 200 + fila + audit log; rechazar sin motivo → 422; rechazar con motivo → 200 + email enqueued (mock); aprobar de nuevo → 409; admin sin permisos → 403 |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (`users`), HU-03.2 (`provider_verifications`), HU-03.4 (`requireAdmin`).
- **Bloquea a:** HU-03.6 (badge verifica `status === 'verificado'`).
- **Recursos compartidos:** tabla `provider_verifications`, tabla `admin_audit_log` (nueva), `requireAdmin`, `emailService` (REQ-17).

## Riesgos tecnicos

- Riesgo: la state machine crece y se vuelve difícil de mantener → Mitigación: la tabla de transiciones es un objeto plano; agregar estado es una línea. Cobertura de tests sobre `canTransition` previene regresiones.
- Riesgo: el email se enqueue ANTES de commitear DB → Mitigación: el enqueue va DESPUÉS del UPDATE exitoso; si falla el enqueue, log + warning, response 200 igual (la transición es la verdad).
- Riesgo: `admin_audit_log.before/after` crece mucho en JSON → Mitigación: el payload es la fila completa de `provider_verifications` (pocos campos); aceptable.
