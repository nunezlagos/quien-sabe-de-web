# HU-17.3 — Template de bienvenida

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** usuario recién registrado
**Quiero** recibir un email de bienvenida
**Para** tener un primer punto de contacto formal

## Criterios de aceptación (Gherkin)

### Escenario: Email enviado tras registro
  Dado un registro exitoso de "ana@ejemplo.cl"
  Cuando termina `POST /api/v1/auth/register`
  Entonces se invoca `EmailService.send("welcome", {name, role}, "ana@ejemplo.cl")`
  Y el email aparece en Mailpit

### Escenario: Template incluye HTML y texto plano
  Cuando inspecciono el mensaje en Mailpit
  Entonces el `Content-Type` es `multipart/alternative` con ambas variantes

### Escenario: Variables escapan HTML
  Cuando `name="<script>alert(1)</script>"`
  Entonces el HTML resultante muestra el texto escapado

## Tareas técnicas

- [ ] Template `src/lib/services/email/templates/welcome.html.ts` y `welcome.txt.ts`
- [ ] Helper `renderTemplate(name, vars)` con escape HTML
- [ ] Tests `tests/unit/email/templates/welcome.test.ts`, `tests/integration/email/welcome-flow.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
