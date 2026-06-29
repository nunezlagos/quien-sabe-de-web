# Diseno tecnico — HU-17.7 — Idempotencia (template, recipient, entity)

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

### Cambio en `email_log` (HU-17.2)

La tabla ya existe. Esta HU agrega un índice único parcial.

Migración `00XX_email_log_idempotency.sql`:
```sql
CREATE UNIQUE INDEX idx_email_log_idempotency
  ON email_log(template, recipient, related_entity)
  WHERE status = 'sent' AND related_entity IS NOT NULL;
```

Nota: SQLite soporta partial indexes desde 3.8; D1 lo soporta.

## Contrato de API

No se exponen endpoints nuevos. La idempotencia es interna a
`EmailService.send`.

`EmailService.send` retorna:
```ts
type SendResult =
  | { id: string; status: 'sent' }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: 'duplicate' };
```

## Validaciones Zod

```ts
// src/lib/validators/email.ts (ampliar)
export const emailSendInputSchema = z.object({
  template: z.string().min(1),
  to: z.string().email(),
  vars: z.record(z.unknown()).default({}),
  relatedEntity: z.string().min(1).max(200).optional(),  // explícito
});
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. Caller invoca `EmailService.send({ template, to, vars, relatedEntity })`.
2. Si `relatedEntity` está presente:
   1. `SELECT id FROM email_log WHERE template=? AND recipient=? AND related_entity=? AND status='sent' LIMIT 1`.
   2. Si encuentra fila → retorna `{ status:'skipped', reason:'duplicate' }`. Inserta fila con `status='skipped'` para auditoría (opcional, decisión en T3).
3. Render template, adapter.send, logEmail.
4. Si dos requests concurrentes: el segundo INSERT viola el índice único parcial; capturar `SQLITE_CONSTRAINT_UNIQUE` y tratar como skipped.
5. Si `relatedEntity` es undefined → omitir el SELECT, enviar siempre.

## Capa de servicios

```ts
// src/lib/services/email/EmailService.ts (ampliar HU-17.1)
export class EmailService {
  async send(input: EmailSendInput): Promise<SendResult> {
    if (input.relatedEntity) {
      const existing = await this.findSentDuplicate(input);
      if (existing) {
        await this.logEmail({ ...input, status: 'skipped' });
        return { status: 'skipped', reason: 'duplicate' };
      }
    }
    try {
      const { html, text } = renderTemplate(input.template, input.vars);
      const result = await this.adapter.send({ to: input.to, subject: ..., html, text });
      await this.logEmail({ ...input, status: 'sent', providerId: result.id });
      return { id: result.id, status: 'sent' };
    } catch (e) {
      await this.logEmail({ ...input, status: 'failed', error: e.message });
      return { status: 'failed', error: e.message };
    }
  }

  private async findSentDuplicate(input: EmailSendInput): Promise<boolean> {
    // SELECT 1 FROM email_log WHERE template, recipient, related_entity, status='sent'
  }
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/idempotency.test.ts` | `findSentDuplicate` retorna true si existe fila `sent`; false si solo hay `failed`; no consulta si `relatedEntity` undefined |
| Unit | `tests/unit/email/send-result.test.ts` | la lógica de retorno (sent/failed/skipped) cubre las 4 ramas (con/sin relatedEntity × primer/segundo envío) |
| Integracion | `tests/integration/email/idempotency.test.ts` | primer send con `(t,r,e)` inserta fila `sent`; segundo send retorna `skipped`; send con `status='failed'` anterior permite retry exitoso; índice único parcial activo (insert manual de 2da fila `sent` falla) |

## Dependencias y secuencia

- **Bloqueado por:** HU-17.1 (interfaz), HU-17.2 (tabla `email_log`).
- **Bloquea a:** ninguno directo; cualquier flujo que quiera garantía de unicidad.
- **Recursos compartidos:** `src/database/schema.ts`, `src/lib/services/email/EmailService.ts`.

## Riesgos tecnicos

- Riesgo: SELECT previo agrega 5-10ms por send → Mitigación: medir en `tests/integration/email/idempotency.test.ts` con `performance.now()`; si supera, mover a cache KV (no en esta HU).
- Riesgo: race entre SELECT e INSERT permite duplicado → Mitigación: el índice único parcial es la red de seguridad; capturar `SQLITE_CONSTRAINT_UNIQUE` y mapear a `skipped`.
- Riesgo: SQLite no soporta partial indexes en alguna versión de D1 → Mitigación: verificar en T1; si no soporta, fallback a índice completo `(template, recipient, related_entity)` con `status` incluido y lógica de skip más elaborada (descartar filas `failed` en SELECT). Documentar la elección.
