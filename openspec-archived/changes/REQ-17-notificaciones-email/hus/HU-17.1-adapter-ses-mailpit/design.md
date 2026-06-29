# Diseno tecnico — HU-17.1 — EmailService con adapter SES y Mailpit

**REQ padre:** REQ-17-notificaciones-email

## Modelo de datos

No se introducen tablas en esta HU. La tabla `email_log` la introduce
HU-17.2; esta HU solo define la interfaz y los adapters.

## Contrato de API

```ts
// src/lib/services/email/EmailAdapter.ts (firmas)
export interface EmailMessage {
  to: string;
  from?: string;                       // default: env.DEFAULT_FROM
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;    // ej: List-Unsubscribe
  tags?: Record<string, string>;       // SES tags
}

export interface EmailSendResult {
  id: string;                          // SES Message-ID o SMTP messageId
  status: 'sent' | 'failed';
  error?: string;
}

export interface EmailAdapter {
  send(msg: EmailMessage): Promise<EmailSendResult>;
}
```

### Uso público

```ts
// src/lib/services/email/EmailService.ts (firmas)
export class EmailService {
  static create(env: Env, deps?: { db?: Db }): EmailService { ... }
  async send(input: { template: string; to: string; vars: Record<string, unknown>; relatedEntity?: string }): Promise<{ id: string; status: 'sent' | 'failed' | 'skipped' }> { ... }
}
```

`EmailService.send` orquesta: (1) render template (HU-17.3+), (2) check
idempotencia (HU-17.7), (3) `adapter.send(...)`, (4) log (HU-17.2). Esta HU
implementa la factory y la delegación al adapter; HU-17.2/17.3/17.7 extienden
`EmailService.send`.

## Validaciones Zod

```ts
// src/lib/validators/email.ts (firmas)
import { z } from 'zod';

export const emailAddressSchema = z.string().email().max(254);
export const emailSubjectSchema = z.string().min(1).max(998);     // RFC 5322
export const emailBodySchema = z.string().min(1).max(1_000_000);  // 1 MB

export const emailMessageSchema = z.object({
  to: emailAddressSchema,
  from: emailAddressSchema.optional(),
  subject: emailSubjectSchema,
  text: emailBodySchema,
  html: emailBodySchema,
  headers: z.record(z.string()).optional(),
  tags: z.record(z.string()).optional(),
});
```

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. Registro (`POST /api/v1/auth/register`) llama `EmailService.send({ template:'welcome', to, vars:{name}, relatedEntity:`user:${id}` })`.
2. `EmailService.create(env)` ya está instanciado en el container de runtime (singleton en `Astro.locals`).
3. Factory elige adapter según env.
4. Adapter envía. Retorna `{ id, status }`.
5. (En HU-17.2) se inserta fila en `email_log`.

## Capa de servicios

```
src/lib/services/email/
  EmailAdapter.ts        ← interface
  EmailService.ts        ← factory + orquestador
  SesAdapter.ts          ← @aws-sdk/client-sesv2
  SmtpAdapter.ts         ← nodemailer (solo dev)
  log.ts                 ← HU-17.2
  templates/             ← HU-17.3+
```

```ts
// src/lib/services/email/SmtpAdapter.ts (firmas)
export class SmtpAdapter implements EmailAdapter {
  constructor(opts: { host: string; port: number; user?: string; pass?: string; from: string }) {}
  async send(msg: EmailMessage): Promise<EmailSendResult> { ... }
}

// src/lib/services/email/SesAdapter.ts (firmas)
export class SesAdapter implements EmailAdapter {
  constructor(opts: { region: string; accessKeyId: string; secretAccessKey: string; from: string }) {}
  async send(msg: EmailMessage): Promise<EmailSendResult> { ... }
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/email/factory.test.ts` | factory elige SmtpAdapter sin SES; elige SesAdapter con SES completo; con SES parcial cae a SmtpAdapter con warning |
| Unit | `tests/unit/email/smtp-adapter.test.ts` | mockea transporter de nodemailer; send() con éxito y con error; mapeo de error a `status:'failed'` |
| Unit | `tests/unit/email/ses-adapter.test.ts` | mockea `SendEmailCommand`; mapeo de `MessageId` y errores |
| Integracion | `tests/integration/email/mailpit.test.ts` | requiere Mailpit; envía y consulta API `:8025/api/v1/messages`; skip si Mailpit no responde |

## Dependencias y secuencia

- **Bloqueado por:** —
- **Bloquea a:** HU-17.2, HU-17.3, HU-17.4, HU-17.5, HU-17.6, HU-17.7.
- **Recursos compartidos:** binding D1 (en HU-17.2), bindings SES_* / SMTP_* vía `Astro.locals.runtime.env` o `process.env` en dev.

## Riesgos tecnicos

- Riesgo: `nodemailer` en el bundle de prod → Mitigación: import dinámico en `SmtpAdapter.ts` dentro de `create()`, gateado por `if (env.SMTP_HOST)`. Verificar con `bunx astro build` que el bundle de prod no incluye `nodemailer`.
- Riesgo: AWS SDK grande → Mitigación: usar `@aws-sdk/client-sesv2` con tree-shaking; evaluar reemplazar por `fetch` directo a la API REST de SES si el bundle es inaceptable (decisión diferida).
- Riesgo: la factory decide mal en staging (envs mezcladas) → Mitigación: log explícito de qué adapter se eligió en cada arranque; tests unitarios cubren combinaciones.
