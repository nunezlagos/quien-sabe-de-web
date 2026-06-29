# Diseno tecnico — HU-17.2 — Tabla email_log para auditoría

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

### Tabla `email_log` (Drizzle)

```ts
// src/database/schema.ts (nuevo)
export const emailLog = sqliteTable('email_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  template: text('template').notNull(),         // ej: 'welcome', 'verification_approved'
  recipient: text('recipient').notNull(),       // email
  status: text('status', { enum: ['sent', 'failed', 'skipped'] }).notNull(),
  relatedEntity: text('related_entity'),        // ej: 'user:42', null para hu 17.7
  providerId: text('provider_id'),              // SES Message-ID o SMTP messageId
  error: text('error'),                         // stack/message si failed
  sentAt: integer('sent_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  byTemplateRecipient: index('idx_email_log_template_recipient')
    .on(t.template, t.recipient),
  bySentAt: index('idx_email_log_sent_at').on(t.sentAt),
}));
```

### Migracion

`src/database/migrations/00XX_email_log.sql`:
- `CREATE TABLE email_log (...)` con `CHECK (status IN ('sent','failed','skipped'))`.
- `CREATE INDEX idx_email_log_template_recipient ON email_log(template, recipient);`
- `CREATE INDEX idx_email_log_sent_at ON email_log(sent_at DESC);`

## Contrato de API

### `GET /api/v1/admin/email-log`

Auth: rol `admin` requerido (middleware).

Query:
- `limit` (int, default 50, max 200).
- `before` (int, id cursor; opcional).
- `status` (enum opcional, filtra por status).
- `template` (string opcional, filtra por template exacto).

Response 200:
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 123, "template": "welcome", "recipient": "ana@x.cl", "status": "sent", "related_entity": "user:42", "provider_id": "...", "sent_at": "2026-06-18T10:00:00Z" }
    ],
    "next_cursor": 122
  }
}
```

## Validaciones Zod

```ts
// src/lib/validators/email.ts (ampliar)
export const emailLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.coerce.number().int().positive().optional(),
  status: z.enum(['sent', 'failed', 'skipped']).optional(),
  template: z.string().min(1).max(80).optional(),
});
```

## Componentes UI

No aplica. El consumidor es el dashboard admin (HU-13.*) y se construye en
otra HU; esta HU expone solo el endpoint.

## Flujo de interaccion (secuencial)

1. `EmailService.send(input)` (de HU-17.1) llama a `logEmail(...)` después de invocar el adapter.
2. `logEmail` recibe `{ template, recipient, status, relatedEntity, providerId, error }` y hace `INSERT INTO email_log`.
3. Si el insert falla (DB caída), se loguea con `console.error` y se continúa (no se propaga la excepción al caller; el email ya se envió o ya falló).
4. Admin en `/admin/email-log` carga página; la página hace fetch al endpoint con paginación cursor.

## Capa de servicios

```ts
// src/lib/services/email/log.ts (firmas)
export type EmailLogInsert = {
  template: string;
  recipient: string;
  status: 'sent' | 'failed' | 'skipped';
  relatedEntity?: string;
  providerId?: string;
  error?: string;
};

export async function logEmail(db: Db, row: EmailLogInsert): Promise<void>;

// src/lib/services/email/log-query.ts
export async function listEmailLog(
  db: Db,
  q: { limit: number; before?: number; status?: string; template?: string },
): Promise<{ items: EmailLogRow[]; nextCursor: number | null }>;
```

`logEmail` se integra en `EmailService.send` después de la llamada al
adapter (status=`sent` o `failed`). HU-17.7 introduce el path `skipped`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/email.test.ts` (extender) | `emailLogQuerySchema` valida limit, before, status enum, template string |
| Unit | `tests/unit/email/log.test.ts` | `logEmail` no lanza si DB insert falla (mock que rechaza); `listEmailLog` aplica filtros |
| Integracion | `tests/integration/email/log.test.ts` | flujo `EmailService.send` con adapter mockeado (ok) inserta fila `status='sent'`; con adapter que falla inserta `status='failed'` con `error`; caller no se entera de la falla del adapter |
| Integracion | `tests/integration/email/log-endpoint.test.ts` | admin ve listado paginado; no-admin recibe 403; query con filtros aplica correctamente |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1 (interfaz `EmailAdapter` + `EmailService.send`).
- **Bloquea a:** HU-17.7 (idempotencia, que setea `status='skipped'`).
- **Recursos compartidos:** `src/database/schema.ts`, `src/lib/services/email/EmailService.ts`.

## Riesgos tecnicos

- Riesgo: el `INSERT` puede ser costoso si la tabla crece → Mitigación: índice por `sent_at` permite paginar sin scan; en el futuro, particionado mensual o cron de purge.
- Riesgo: si el adapter lanza (no retorna `{status:'failed'}`) el flujo se rompe antes del log → Mitigación: el wrapper de HU-17.1 captura con try/catch y mapea a `{status:'failed', error}`; el test cubre este path.
- Riesgo: el cursor `before` se invalida si la tabla se trunca entre páginas → Mitigación: documentar; el caller debe manejar items repetidos.
