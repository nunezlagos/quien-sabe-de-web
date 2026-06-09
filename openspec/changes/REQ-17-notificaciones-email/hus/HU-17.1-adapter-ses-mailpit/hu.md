# HU-17.1 — EmailService con adapter SES y Mailpit

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** sistema
**Quiero** tener una única interfaz para enviar emails que use SES en prod y Mailpit en dev
**Para** no duplicar lógica por entorno

## Criterios de aceptación (Gherkin)

### Escenario: Adapter SMTP usado en dev
  Dado env `NODE_ENV=development` y `SMTP_HOST=mailpit`
  Cuando `EmailService.send("welcome", {name:"Ana"}, "ana@ejemplo.cl")` se invoca
  Entonces el email aparece en Mailpit UI (`http://localhost:8026`)

### Escenario: Adapter SES usado en prod
  Dado env producción con `SES_*` configurados
  Cuando se invoca el servicio
  Entonces el adapter `SesAdapter` llama AWS SDK SES con credenciales correctas

### Escenario: Factory elige adapter correcto
  Cuando se instancia `EmailService` sin SES creds
  Entonces el adapter activo es `SmtpAdapter`

## Tareas técnicas

- [ ] Interfaz `EmailAdapter` en `src/lib/services/email/EmailAdapter.ts`
- [ ] `SesAdapter.ts`, `SmtpAdapter.ts`
- [ ] Factory `EmailService.ts` que decide por env
- [ ] Tests `tests/unit/email/factory.test.ts`, `tests/integration/email/mailpit.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
