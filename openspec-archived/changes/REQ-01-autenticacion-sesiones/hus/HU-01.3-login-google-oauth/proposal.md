# Propuesta — HU-01.3 — Login con Google OAuth (state + PKCE)

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

Vecinos y prestadores con cuenta Google quieren evitar crear y recordar otra contraseña. Esta HU implementa el flujo OAuth Authorization Code con PKCE (S256) contra Google: state aleatorio + code_verifier en KV con TTL 10min, callback que valida id_token y crea (o asocia) cuenta. Es la opción de menor fricción para nuevos usuarios en Chile, donde Google domina el mercado de cuentas.

## Mockups de referencia

- No existe mockup para OAuth. **Mockup TBD** — el botón "Continuar con Google" vive en `src/pages/login.astro` y `src/pages/register.astro` (vistas creadas en HU-01.1) sin diseño final aún. La redirección post-éxito va a `/onboarding` (mockup TBD, cubierto en HU-02.2).

## Alternativas consideradas

### Opcion A — Authorization Code + PKCE S256 contra Google
- `state` y `code_verifier` generados server-side, guardados en KV bajo `oauth:state:<state>` con TTL 600s.
- Endpoint genérico `src/pages/api/v1/auth/oauth/[provider].ts` parametrizable por `provider` para reuso con Facebook (HU-01.4).
- Validación de `id_token` contra `https://oauth2.googleapis.com/token` y JWKS de Google.
- Pro: PKCE mitiga authorization code interception; state mitiga CSRF en el callback.
- Pro: reuso del endpoint genérico reduce duplicación con Facebook.

### Opcion B — Implicit flow
- Pro: simple, sin code_verifier.
- Contra: deprecated por OAuth 2.1; expone access_token al browser; sin refresh.

### Opcion C — OpenID Connect puro (sin PKCE)
- Contra: vulnerable a code injection en app pública.

## Decision

Se elige **Opcion A**. Sigue el estándar OAuth 2.1 y los requisitos de seguridad de Google para apps server-side (state + PKCE). El endpoint genérico `[provider].ts` reduce duplicación y facilita agregar GitHub/Apple más adelante. La asociación por email (si el usuario ya existe) es transparente: crea fila en `oauth_accounts` y emite sesión sin duplicar el `users`.

## Riesgos y mitigaciones

- Riesgo: credentials filtradas en cliente → Mitigación: el `client_secret` solo vive en el server (binding de Cloudflare), nunca expuesto al browser.
- Riesgo: `state` re-usado o caducado → Mitigación: TTL 10min + delete on read + comparación constant-time.
- Riesgo: Google devuelve email distinto al de la cuenta local → Mitigación: la asociación se hace sólo si el email coincide EXACTAMENTE (lowercase); cualquier divergencia crea error 400 explícito.
- Riesgo: validación de `id_token` insuficiente → Mitigación: verificar firma contra JWKS de Google (`https://www.googleapis.com/oauth2/v3/certs`), `iss === 'https://accounts.google.com'`, `aud === GOOGLE_OAUTH_CLIENT_ID`, `exp > now`.

## Metrica de exito

- `GET /api/v1/auth/oauth/google` responde 302 con `Location` hacia `accounts.google.com` y la URL incluye `state`, `code_challenge=S256`, `code_challenge_method=S256`.
- `state` y `code_verifier` quedan en KV con TTL 600s.
- Callback con `state` válido crea fila en `oauth_accounts` (o asocia) y emite cookie de sesión.
- Callback con `state` inválido o ausente → 400 sin crear nada en DB.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/services/auth/oauth/google.ts`.
