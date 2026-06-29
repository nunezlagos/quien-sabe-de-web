# HU-01.3 — Login con Google OAuth (state + PKCE)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.3-login-google-oauth`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `oauthAccounts` a `src/database/schema.ts` con UNIQUE(provider, providerUserId), FK a `users` ON DELETE CASCADE, e índices.
- [ ] **T2** Migración Drizzle `src/database/migrations/0003_oauth_accounts.sql` con CHECK sobre `provider`.
- [ ] **T3** Helpers PKCE en `src/lib/services/auth/oauth/pkce.ts`: `generateCodeVerifier()`, `generateCodeChallenge(verifier)`, `generateState()`.
- [ ] **T4** Helpers `oauth:state:*` en `src/lib/services/auth/oauth/state.ts`: `saveOAuthState(env, state, payload)` y `loadAndDeleteOAuthState(env, state)` (atomic delete via `getWithMetadata` + `delete`).
- [ ] **T5** Helper `src/lib/services/auth/oauth/google.ts` con `buildAuthorizationUrl`, `exchangeCode`, `verifyIdToken` (JWKS fetch on-demand con cache 1h).
- [ ] **T6** Endpoint genérico `src/pages/api/v1/auth/oauth/[provider].ts` que dispatcha a `google` o `facebook`.
- [ ] **T7** Endpoint `src/pages/api/v1/auth/oauth/[provider]/callback.ts` que orquesta: loadAndDeleteOAuthState → exchangeCode → verifyIdToken → buscar/crear user → crear/buscar oauth_account → createSession → redirect.
- [ ] **T8** Variables `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` en `wrangler.toml.example` con comentario de cómo obtenerlas.
- [ ] **T9** Botón "Continuar con Google" en `src/pages/login.astro` y `src/pages/register.astro` (HU-01.1) apuntando a `/api/v1/auth/oauth/google`.
- [ ] **T10** Zod schemas `OAuthCallbackQuery` y `GoogleIdTokenClaims` en `src/lib/validators/oauth.ts`.
- [ ] **T11** Tests:
  - [ ] `tests/unit/auth/oauth/pkce.test.ts` — `generateCodeChallenge(sha256(verifier))` determinístico y produce string base64url válido.
  - [ ] `tests/unit/auth/oauth/google.test.ts` — `buildAuthorizationUrl` contiene `state`, `code_challenge`, `code_challenge_method=S256`, `scope=openid email profile`, `client_id` y `redirect_uri`.
  - [ ] `tests/unit/validators/oauth.test.ts` — `GoogleIdTokenClaims` rechaza `iss` distinto, `aud` vacío, `email` no-email, `exp` pasado.
  - [ ] `tests/integration/auth/oauth-google.test.ts` — callback con state válido crea user + oauth_account + cookie + redirect `/onboarding`; callback con state inválido → 400; callback con email ya asociado a oauth_account → solo sesión, sin duplicar user.
  - [ ] `tests/integration/auth/oauth-google-associate.test.ts` — usuario existente sin oauth_accounts → callback crea fila en `oauth_accounts` con `user_id` correcto.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: omitir la verificación de `iss === 'https://accounts.google.com'` en `verifyIdToken` → test unit de `GoogleIdTokenClaims` con `iss='https://evil.com'` debe caer → restaurar.
- [ ] **Sabotaje 2**: en el callback, no hacer `DELETE oauth:state:<state>` después de usarlo → test de reuso de `state` (segunda llamada con mismo `state`) debe pasar de 400 a "sesión creada" (vulnerable) → restaurar.
- [ ] **Sabotaje 3**: cambiar `findUserByEmail` por un lookup case-sensitive en la rama de asociación → test con email existente en mayúsculas distintas debe detectar duplicación de users → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/auth/oauth/google.ts` y `src/lib/services/auth/oauth/pkce.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.3-login-google-oauth` (no merge a main sin review)
