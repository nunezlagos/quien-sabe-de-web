# Diseño técnico — HU-20.1 — Envío automático de email de verificación al registrar

**REQ padre:** REQ-20-verificacion-email-post-registro

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto)
export const users = sqliteTable('users', {
  // ... columnas existentes (REQ-02)
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }), // nullable
})

export const emailLog = sqliteTable('email_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type', { enum: ['email_verify', 'password_reset', 'notification'] }).notNull(),
  status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull(),
  providerMessageId: text('provider_message_id'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

### Migración Drizzle

- Archivo objetivo: `src/database/migrations/NNNN_email_verify_log.sql`
- Cambios:
  - `ALTER TABLE users ADD COLUMN email_verified_at INTEGER NULL` (si no existe).
  - `CREATE TABLE email_log (...)` con índice `(user_id, type, created_at)`.

### KV

- Clave primaria: `email_verify:<token_hex>` → JSON `{ user_id, expires_at }`, TTL 86400 s.
- Clave secundaria: `email_verify_user:<user_id>` → `<token_hex>` (para detectar token vigente y reutilizar).

## Contrato de API

Esta HU no expone endpoints nuevos. Modifica el handler de registro existente:

| Endpoint | Método | Auth | Request body | Response 201 | Errores |
|---|---|---|---|---|---|
| `/api/v1/auth/register` (REQ-02) | POST | público | `{ email, password, ... }` | `{ user_id, requires_email_verification: true }` | 400 validación, 409 email duplicado, 500 fallo crítico |

Side effect agregado: tras `INSERT` exitoso del usuario, invoca `sendVerificationEmail(userId, email)` envuelto en `ctx.waitUntil`.

## Validaciones Zod

```ts
// src/lib/validators/auth.ts (pseudocódigo, sin cambios sobre el schema de registro existente)
export const registerSchema = z.object({
  email: z.string().email(),
  // ... resto definido en REQ-02
})

// Nuevo helper de token
export const verifyTokenSchema = z.string().regex(/^[0-9a-f]{64}$/)
```

## Componentes UI

HU 100% backend. La UI consumidora del link es responsabilidad de HU-20.2 (`/verify-email/[token]`). El template del email se diseña siguiendo el branding visible en `mockups/verify-email.html:33-38` (logo `ri-community-line` + "QuiénSabe").

### Template de correo

- Archivo objetivo: `src/lib/services/email/templates/verify-email.ts`
- Variables: `{ recipientName, verifyUrl, expiresInHours }`.
- Output: `{ subject, html, text }`.
- Subject sugerido: `Confirma tu email en QuiénSabe`.
- Cuerpo HTML: header con logo, párrafo CTA, botón hacia `${PUBLIC_BASE_URL}/verify-email/<token>`, footer con "El enlace caduca en 24 horas" (alineado con copy de `mockups/verify-email.html:81`).

## Flujo de interacción (secuencial)

1. Usuario completa formulario de registro (REQ-02).
2. Handler `register.ts` valida con Zod, hashea contraseña, ejecuta `INSERT INTO users`.
3. Handler invoca `emailVerify.issueToken({ userId })`:
   - genera 32 bytes hex,
   - intenta leer `email_verify_user:<userId>` para reutilizar,
   - escribe `email_verify:<token>` y `email_verify_user:<userId>` con TTL 86400.
4. Handler ejecuta `ctx.waitUntil(emailVerify.send({ userId, email, token }))`.
5. Servicio `email-verify.ts` arma el `verifyUrl`, llama al adapter SES/Mailpit y registra fila en `email_log` con estado `sent` o `failed`.
6. Handler responde 201 al cliente sin esperar al SMTP.

## Capa de servicios

- `src/lib/services/auth/email-verify.ts`
  - `issueToken({ userId }) -> Promise<{ token, expiresAt }>`
  - `send({ userId, email, token }) -> Promise<void>`
  - `revokeToken(token) -> Promise<void>` (usado por HU-20.2 y HU-20.3)
- `src/lib/services/email/mailer.ts`
  - `sendTransactional({ to, subject, html, text }) -> Promise<{ messageId }>`
  - Selecciona transport según `env.MAIL_DRIVER` (`ses` | `mailpit`).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/email-verify-token.test.ts` | Generación de 32 bytes hex, reutilización de token vigente |
| Unit | `tests/unit/email/verify-email-template.test.ts` | Render del template, presencia del `verifyUrl`, mensajes en español |
| Integración | `tests/integration/auth/email-verify-send.test.ts` | Registro → fila `email_log` + correo en Mailpit (`http://mailpit:8025/api/v1/messages`) |
| E2E | `tests/e2e/registro-recibe-email.spec.ts` | Registro → polling a Mailpit → cuerpo contiene URL con token de 64 hex |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (handler `register.ts`), REQ-17 (infra mail).
- **Bloquea a:** HU-20.2 (necesita tokens emitidos), HU-20.3 (reusa servicio).
- **Recursos compartidos:** binding KV `SESSION`, binding D1, transport mail (SES/Mailpit), variable `PUBLIC_BASE_URL`.

## Riesgos técnicos

- Riesgo: `ctx.waitUntil` no disponible en algún path → fallback a `await`. Mitigación: helper `runDeferred(ctx, promise)` que detecta `ctx` y aplica `waitUntil` o `await`.
- Riesgo: token reutilizado tras expiración parcial KV (TTL distinto entre claves). Mitigación: setear ambas claves en la misma operación y mismo TTL; verificar `email_verify:<token>` antes de reusar `email_verify_user:<userId>`.
- Riesgo: Mailpit down en CI → tests E2E flaky. Mitigación: healthcheck previo y retry con backoff exponencial (3 intentos, máx 5 s).
