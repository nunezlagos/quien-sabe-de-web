# HU-20.1 — Envío automático de email de verificación al registrar

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-20-verificacion-email-post-registro
**Rama:** `feat/HU-20.1-envio-email-verificacion`

## Tareas técnicas

- [ ] **T1** Agregar columna `emailVerifiedAt` a `users` en `src/database/schema.ts` (nullable, integer unixepoch timestamp).
- [ ] **T2** Agregar tabla `email_log` a `src/database/schema.ts` con columnas y CHECKs: `type IN ('email_verify','password_reset','notification')`, `status IN ('pending','sent','failed')`. FK `user_id REFERENCES users(id)`.
- [ ] **T3** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_email_verify_log.sql` con `ALTER TABLE users ADD COLUMN email_verified_at INTEGER NULL` (si no existe), `CREATE TABLE email_log`, índice `(user_id, type, created_at)`.
- [ ] **T4** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T5** Helper `runDeferred(ctx, promise)` en `src/lib/utils/async.ts` que detecta `ctx.waitUntil` y aplica fallback `await` si no existe.
- [ ] **T6** Servicio `src/lib/services/auth/email-verify.ts` con `issueToken`, `send`, `revokeToken`. Usa `emailVerify:<token>` (TTL 86400) y `emailVerifyUser:<userId>` para reutilizar token vigente.
- [ ] **T7** Servicio `src/lib/services/email/mailer.ts` con `sendTransactional({to, subject, html, text})`. Selecciona transport según `env.MAIL_DRIVER` (`ses` | `mailpit`).
- [ ] **T8** Template `src/lib/services/email/templates/verify-email.ts` exportando `{subject, html, text}`. Variables `{recipientName, verifyUrl, expiresInHours}`. Branding `mockups/verify-email.html:33-38`.
- [ ] **T9** Enganchar en `src/pages/api/v1/auth/register.ts` (REQ-02): tras INSERT exitoso, `runDeferred(ctx, emailVerify.send({userId, email, token}))`. Response 201 incluye `requires_email_verification: true`.
- [ ] **T10** Validador `verifyTokenSchema` en `src/lib/validators/auth.ts` (regex 64 hex).
- [ ] **T11** Tests:
  - [ ] `tests/unit/auth/email-verify-token.test.ts` — genera 32 bytes hex, reutilización de token vigente.
  - [ ] `tests/unit/email/verify-email-template.test.ts` — render del template, presencia del `verifyUrl`, mensajes en español.
  - [ ] `tests/integration/auth/email-verify-send.test.ts` — registro → fila `email_log` + correo en Mailpit (API `http://mailpit:8025/api/v1/messages`).
  - [ ] `tests/e2e/registro-recibe-email.spec.ts` — registro → polling Mailpit → cuerpo contiene URL con token 64 hex.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `issueToken`, no escribir la clave secundaria `emailVerifyUser:<userId>` → reenvío genera token duplicado, test integración rojo → restaurar
- [ ] Sabotaje 2: no envolver el `emailVerify.send` en `runDeferred` → handler espera al SMTP, latencia p95 aumenta, test de performance rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/email-verify.ts`, `src/lib/services/email/templates/verify-email.ts`
- [ ] Type check verde
- [ ] Commit `feat: envío email verificación post-registro` y push