# HU-01.4 — Login con Facebook OAuth

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.4-login-facebook-oauth`

## Tareas tecnicas

- [ ] **T1** Helper `src/lib/services/auth/oauth/facebook.ts` con `buildAuthorizationUrl(env, redirectUri, state)`, `exchangeCode(env, code, redirectUri)`, `getProfile(accessToken)`.
- [ ] **T2** Constante `FACEBOOK_API_VERSION = 'v18.0'` exportada desde el helper.
- [ ] **T3** Extender `src/pages/api/v1/auth/oauth/[provider].ts` para dispatchar `facebook` además de `google`.
- [ ] **T4** Extender `src/pages/api/v1/auth/oauth/[provider]/callback.ts` para invocar `facebook.exchangeCode` y `facebook.getProfile`, con control de error si email ausente.
- [ ] **T5** Zod schema `FacebookProfile` en `src/lib/validators/oauth.ts` (extender archivo existente).
- [ ] **T6** Variables `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET` en `wrangler.toml.example` con comentario sobre el dashboard de Facebook Developers.
- [ ] **T7** Botón "Continuar con Facebook" en `src/pages/login.astro` y `src/pages/register.astro`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/auth/oauth/facebook.test.ts` — `buildAuthorizationUrl` contiene `client_id`, `redirect_uri`, `state`, `scope=email,public_profile` y dominio `facebook.com/v18.0/dialog/oauth`.
  - [ ] `tests/unit/validators/oauth.test.ts` — `FacebookProfile` rechaza `id=''` y `email='no-email'`.
  - [ ] `tests/integration/auth/oauth-facebook.test.ts` — callback con state válido + email → user + oauth_account + cookie + redirect; callback sin email → 400 `email requerido por Facebook`; callback con state inválido → 400.
  - [ ] `tests/integration/auth/oacebook-facebook-associate.test.ts` — usuario existente sin oauth_accounts Facebook → callback crea fila con `provider='facebook'` y `provider_user_id=<fb id>` correcto.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: eliminar el check `if (!profile.email) return 400` en el callback de Facebook → test "Email no provisto por Facebook → falla controlada" debe caer → restaurar.
- [ ] **Sabotaje 2**: en `buildAuthorizationUrl` apuntar a `https://www.facebook.com/v17.0/...` (versión vieja) → test unit que verifica dominio debe detectar mismatch → restaurar (debe ser `v18.0`).
- [ ] **Sabotaje 3**: en el callback de Facebook, omitir la rama "asociar user existente por email" y siempre crear user nuevo → test de asociación debe detectar duplicación de users con mismo email → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/auth/oauth/facebook.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.4-login-facebook-oauth` (no merge a main sin review)
