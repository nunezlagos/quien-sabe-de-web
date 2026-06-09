# HU-01.3 — Login con Google OAuth (state + PKCE)

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** vecino o prestador con cuenta Google
**Quiero** iniciar sesión con un solo click usando Google
**Para** evitar crear y recordar otra contraseña

## Criterios de aceptación (Gherkin)

### Escenario: Inicio del flujo OAuth Google
  Cuando envío `GET /api/v1/auth/oauth/google`
  Entonces recibo status 302 hacia `https://accounts.google.com/o/oauth2/v2/auth?...`
  Y la URL incluye `state` aleatorio y `code_challenge` (PKCE S256)
  Y `state` y `code_verifier` quedan guardados en KV con TTL 10 min

### Escenario: Callback exitoso crea usuario nuevo
  Dado que NO existe usuario con email "ana@gmail.com"
  Y Google devuelve un id_token válido para ese email
  Cuando se invoca `GET /api/v1/auth/oauth/google/callback?code=...&state=<válido>`
  Entonces se crea un registro en `users` con `role=vecino` y `status=active`
  Y se crea entrada en `oauth_accounts` con `provider="google"`
  Y se setea cookie `session` y redirige a `/onboarding`

### Escenario: Callback asocia cuenta existente por email
  Dado que existe usuario con email "ana@gmail.com" sin oauth_accounts
  Cuando se completa el callback de Google con ese email
  Entonces se crea fila en `oauth_accounts` ligando user_id y provider_user_id
  Y se inicia sesión sin duplicar el usuario

### Escenario: State inválido aborta el flujo
  Cuando llega un callback con `state` no presente en KV
  Entonces recibo status 400 con `{ "error": "state inválido" }`
  Y NO se crea usuario ni sesión

## Tareas técnicas

- [ ] Variables `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` documentadas en `wrangler.toml.example`
- [ ] Helper `src/lib/services/auth/oauth/google.ts` con generación de state + PKCE
- [ ] Endpoint `src/pages/api/v1/auth/oauth/[provider].ts`
- [ ] Endpoint `src/pages/api/v1/auth/oauth/[provider]/callback.ts`
- [ ] Schema `oauth_accounts` en `src/database/schema.ts` con UNIQUE(provider, provider_user_id)
- [ ] Tests `tests/unit/auth/oauth/google.test.ts` y `tests/integration/auth/oauth-google.test.ts` con mock de id_token

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
