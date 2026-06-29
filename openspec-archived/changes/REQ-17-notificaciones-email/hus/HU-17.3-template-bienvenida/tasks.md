# HU-17.3 — Template de bienvenida

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.3-template-bienvenida`

## Tareas tecnicas

- [ ] **T1** Helper `escapeHtml(s: string)` en `src/lib/services/email/templates/escape.ts` con map de entidades `&<>"'`. Tests cubren cada carácter e idempotencia.
- [ ] **T2** `welcome.html.ts` y `welcome.txt.ts` en `src/lib/services/email/templates/`. Cada uno exporta `render(vars: WelcomeVars): string`. HTML aplica `escapeHtml` a `name`; texto plano no requiere escape.
- [ ] **T3** Registry en `src/lib/services/email/templates/index.ts` que mapea `templateName` → `{ html, text, varsSchema }`. Inicialmente solo `welcome`.
- [ ] **T4** `renderTemplate(name, vars)` en `src/lib/services/email/render.ts` que valida con Zod el schema del template, despacha a `html` y `text`, retorna `{ html, text }`. Lanza `TemplateValidationError` si el template no existe o vars inválidas.
- [ ] **T5** Integrar `renderTemplate` en `EmailService.send` (de HU-17.1): antes de invocar el adapter, llamar `renderTemplate(input.template, input.vars)`; pasar `{ html, text }` al adapter como `EmailMessage`.
- [ ] **T6** Hook en `POST /api/v1/auth/register` (de REQ-01) para disparar `EmailService.send({ template:'welcome', to: user.email, vars: { name, role: user.role, loginUrl: Astro.url.origin + '/login' }, relatedEntity: `user:${user.id}` })`. Si el envío falla, no se aborta el registro (welcome es fire-and-forget; ya cubierto por HU-17.2).
- [ ] **T7** Tests:
  - [ ] `tests/unit/email/escape.test.ts` — `escapeHtml("<script>")` → `&lt;script&gt;`; caracteres unicode no se rompen; idempotente.
  - [ ] `tests/unit/email/templates/welcome.test.ts` — render con vars normales retorna HTML + text; render con `name="<script>alert(1)</script>"` produce HTML escapado y text sin escape; varsSchema rechaza `role: "hacker"`; `varsSchema` rechaza falta de `name`.
  - [ ] `tests/unit/email/render.test.ts` — `renderTemplate('welcome', {...})` retorna `{ html, text }`; template desconocido lanza `TemplateValidationError`; vars inválidos lanza con detalle.
  - [ ] `tests/integration/email/welcome-flow.test.ts` — `EmailService.send` con `template:'welcome'` entrega `EmailMessage` con `html` y `text` poblados y `subject` correcto al adapter mockeado; fila en `email_log` con `template='welcome'`.
- [ ] **T8** Verificar manualmente con Mailpit: registrar un user de prueba → revisar `http://localhost:8026` → confirmar que el email llega con `Subject` "¡Bienvenido a Quién Sabe!" y body HTML renderiza el nombre.

## Sabotajes a confirmar

1. En `welcome.html.ts`, eliminar la llamada a `escapeHtml(name)` e interpolar el nombre crudo → test unitario que pasa `name="<script>alert(1)</script>"` y espera `&lt;script&gt;` en el output falla → restaurar.
2. En `renderTemplate`, omitir la validación Zod → test unitario que pasa `role: "hacker"` espera excepción y recibe render "exitoso" → restaurar.
3. En `EmailService.send`, no llamar a `renderTemplate` y pasar `vars` crudo como `html` → test integración que verifica `EmailMessage.html` contiene HTML real falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/email tests/integration/email/welcome-flow.test.ts` → verde
- [ ] Sabotaje 1 confirmado: sin escape → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin Zod → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: render omitido → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/email/templates/{escape,welcome.html,welcome.txt}.ts` y `render.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: template welcome con escape HTML` y push a rama (no merge a main)
