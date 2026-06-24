# HU-20.1 — Envío automático de email de verificación al registrar

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-20-verificacion-email-post-registro

## Historia de usuario

**Como** plataforma
**Quiero** disparar un email de verificación tras el registro
**Para** confirmar que el email del usuario es válido y suyo

## Criterios de aceptación (Gherkin)

### Escenario: Registro dispara email
  Cuando un nuevo usuario se registra vía REQ-02
  Entonces se genera token y se persiste KV `email_verify:<token>` TTL 86400
  Y `email_log` tiene una fila tipo `email_verify`
  Y Mailpit recibe el correo en `localhost:8025`

### Escenario: Email contiene link funcional
  Cuando reviso el mail en Mailpit
  Entonces el cuerpo contiene `https://<host>/verify-email/<token>` con token de 32 bytes hex

### Escenario: Reintento idempotente si falla SES
  Dado SES falla temporalmente
  Cuando se reintenta
  Entonces no se duplica el token (mismo token reutilizado si KV aún vigente)

## Tareas técnicas

- [ ] Hook en `src/pages/api/v1/auth/register.ts` (REQ-02) que invoca `sendVerificationEmail(userId, email)`
- [ ] Servicio `src/lib/services/auth/email-verify.ts` con generación de token + persistencia KV
- [ ] Template `verify_email` en `src/lib/services/email/templates/verify-email.ts`
- [ ] Tests `tests/integration/auth/email-verify-send.test.ts` validando Mailpit (`localhost:8025` API)

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
