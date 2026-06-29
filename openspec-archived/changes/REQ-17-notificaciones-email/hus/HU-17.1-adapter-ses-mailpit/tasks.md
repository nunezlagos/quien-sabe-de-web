# HU-17.1 — EmailService con adapter SES y Mailpit

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.1-adapter-ses-mailpit`

## Tareas tecnicas

- [ ] **T1** Instalar `nodemailer` y `@aws-sdk/client-sesv2` como deps (solo dev para nodemailer si es posible; si no, aceptar bundle más grande con tree-shaking).
- [ ] **T2** Crear `src/lib/services/email/EmailAdapter.ts` con interface `EmailAdapter`, tipos `EmailMessage`, `EmailSendResult`, `emailMessageSchema` (Zod). Helper `validateMessage(msg)` que lanza si falla Zod.
- [ ] **T3** `src/lib/services/email/SmtpAdapter.ts` con constructor `{ host, port, user?, pass?, from }`; `send(msg)` usa `nodemailer.createTransport(...)` y retorna `{ id: info.messageId, status }`. Mapea `nodemailer` errors a `{ status:'failed', error }`.
- [ ] **T4** `src/lib/services/email/SesAdapter.ts` con constructor `{ region, accessKeyId, secretAccessKey, from }`; `send(msg)` usa `new SESv2Client(...)` + `SendEmailCommand` con `Content: { Simple: { Subject, Body: { Text, Html } } }`. Mapea `MessageId` y `AwsError` a `EmailSendResult`.
- [ ] **T5** `src/lib/services/email/EmailService.ts` con `static create(env, deps?)` que decide:
  - Si `env.SES_REGION && env.SES_ACCESS_KEY_ID && env.SES_SECRET_ACCESS_KEY` → `SesAdapter`.
  - Else si `env.SMTP_HOST` → `SmtpAdapter`.
  - Else → throws explícito ("Configura SES_* o SMTP_HOST").
  - Log de qué adapter se eligió (`console.info('[email] adapter=SesAdapter')`).
  - Por ahora `send(input)` solo delega al adapter y retorna `{ id, status }`. HU-17.2 lo extiende con log.
- [ ] **T6** Helper `getEmailService(Astro)` en `src/lib/services/email/context.ts` que cachea instancia en `Astro.locals.emailService` por request.
- [ ] **T7** Tests:
  - [ ] `tests/unit/email/factory.test.ts` — 4 combinaciones de env (sin vars; SMTP solo; SES completo; SES parcial + SMTP) verifican adapter elegido via mock de los imports.
  - [ ] `tests/unit/email/smtp-adapter.test.ts` — `send()` con transporter mockeado (caso ok + caso error). Verifica headers y tags no se filtran.
  - [ ] `tests/unit/email/ses-adapter.test.ts` — `send()` con `SendEmailCommand` mockeado; verifica payload (Subject.Data, Body.Text.Data, Body.Html.Data).
  - [ ] `tests/integration/email/mailpit.test.ts` — `await EmailService.create(env).send(...)` con env Mailpit; consulta `http://mailpit:8025/api/v1/messages`; skip si Mailpit no responde (timeout 1s).
- [ ] **T8** Verificar bundle de prod: `docker exec quien-sabe-app bunx astro build`; revisar que `dist/_worker.js` no incluye `nodemailer` (grep simple).

## Sabotajes a confirmar

1. En `EmailService.create`, invertir la prioridad (SES primero aunque incompleto) → factory test con SES parcial + SMTP debe elegir SmtpAdapter y falla → restaurar.
2. En `SmtpAdapter.send`, eliminar el `try/catch` alrededor de `transporter.sendMail` → un fallo del SMTP lanza excepción no manejada, test con transporter mockeado que rechaza debe pasar a `status:'failed'` y falla → restaurar.
3. En `SesAdapter`, hardcodear `from: 'noreply@hardcoded.cl'` ignorando el `msg.from` → test unitario que verifica `Source: msg.from ?? defaultFrom` falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/email tests/integration/email/mailpit.test.ts` → verde (con skip en CI si Mailpit no disponible)
- [ ] Sabotaje 1 confirmado: prioridad invertida → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin try/catch → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: from hardcodeado → test rojo → restaurar
- [ ] Bundle de prod sin `nodemailer` (grep confirma)
- [ ] Coverage ≥ 90 % en `src/lib/services/email/{EmailAdapter,EmailService,SmtpAdapter,SesAdapter}.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: EmailService con adapters SES y Mailpit` y push a rama (no merge a main)
