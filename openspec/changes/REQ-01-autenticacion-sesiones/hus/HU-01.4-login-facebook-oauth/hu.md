# HU-01.4 — Login con Facebook OAuth

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** vecino o prestador con cuenta Facebook
**Quiero** iniciar sesión con Facebook
**Para** aprovechar mi cuenta social existente

## Criterios de aceptación (Gherkin)

### Escenario: Inicio del flujo OAuth Facebook
  Cuando envío `GET /api/v1/auth/oauth/facebook`
  Entonces recibo status 302 hacia `https://www.facebook.com/v18.0/dialog/oauth?...`
  Y la URL incluye `state` aleatorio

### Escenario: Callback exitoso crea o asocia cuenta
  Dado un callback con `code` válido para "ana@facebook.com"
  Cuando se invoca `GET /api/v1/auth/oauth/facebook/callback?code=...&state=<válido>`
  Entonces hay sesión activa para ese usuario
  Y existe fila en `oauth_accounts` con provider `facebook`

### Escenario: Email no provisto por Facebook → falla controlada
  Dado que la respuesta de Facebook no incluye email
  Cuando se procesa el callback
  Entonces recibo status 400 con `{ "error": "email requerido por Facebook" }`
  Y NO se crea usuario

### Escenario: State inválido aborta el flujo
  Cuando llega un callback con `state` no presente en KV
  Entonces recibo status 400

## Tareas técnicas

- [ ] Variables `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET` en `wrangler.toml.example`
- [ ] Helper `src/lib/services/auth/oauth/facebook.ts`
- [ ] Reuso del endpoint genérico `src/pages/api/v1/auth/oauth/[provider].ts`
- [ ] Tests `tests/unit/auth/oauth/facebook.test.ts` y `tests/integration/auth/oauth-facebook.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
