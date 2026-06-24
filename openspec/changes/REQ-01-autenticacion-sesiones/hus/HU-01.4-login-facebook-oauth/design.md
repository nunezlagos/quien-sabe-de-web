# Diseno tecnico — HU-01.4 — Login con Facebook OAuth

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

Sin cambios. La tabla `oauthAccounts` ya existe desde HU-01.3 con `provider IN ('google','facebook')` y UNIQUE(provider, providerUserId). Las filas para Facebook usan `provider='facebook'` y `providerUserId=<Facebook user id>`.

## Contrato de API

### `GET /api/v1/auth/oauth/facebook` [público]

Response: 302 hacia `https://www.facebook.com/v18.0/dialog/oauth?client_id=<FACEBOOK_APP_ID>&redirect_uri=<callback>&state=<random>&scope=email,public_profile`.

### `GET /api/v1/auth/oauth/facebook/callback?code=...&state=...` [público]

Flujo interno:
1. `loadAndDeleteOAuthState(env, state)` → si null → 400.
2. POST a `https://graph.facebook.com/v18.0/oauth/access_token` con `client_id`, `client_secret`, `redirect_uri`, `code` → recibe `access_token`.
3. GET `https://graph.facebook.com/me?fields=id,name,email&access_token=<token>` → recibe `{ id, name, email }`.
4. Si `email` ausente/null → 400 `email requerido por Facebook`.
5. Mismo upsert que Google: buscar `oauth_accounts(provider='facebook', provider_user_id=id)` → si existe, login; si no, buscar `users` por email → si existe, crear oauth_account; si no, crear `users` (role='vecino') + `oauth_accounts` + sesión.
6. `createSession` → setea cookie → redirect a `redirectAfter` (default `/onboarding`).

Errores: 400 `state inválido`, 400 `email requerido por Facebook`, 502 si Graph responde error.

## Validaciones Zod

```ts
// src/lib/validators/oauth.ts (extendido)
export const FacebookProfile = z.object({
  id: z.string().min(1).max(64),
  name: z.string().optional(),
  email: z.string().email(),
})
```

`OAuthCallbackQuery` se reusa de HU-01.3.

## Componentes UI

- Botón "Continuar con Facebook" en `src/pages/login.astro` y `src/pages/register.astro` apuntando a `/api/v1/auth/oauth/facebook`.
- Variables en `wrangler.toml.example`:
  ```
  FACEBOOK_APP_ID = "<your-app-id>"
  FACEBOOK_APP_SECRET = "<your-app-secret>"
  ```

## Flujo de interaccion (secuencial)

1. Click → `GET /api/v1/auth/oauth/facebook`.
2. Helper `facebook.buildAuthorizationUrl(env, redirectUri, state)` retorna URL completa con `scope=email,public_profile`.
3. KV `put('oauth:state:<state>', { codeVerifier: '', provider: 'facebook', redirectAfter: '/onboarding' }, { expirationTtl: 600 })`. (Facebook no usa PKCE nativo; `codeVerifier` queda vacío — la protección es `state`).
4. Facebook autentica y redirige a callback con `code` y `state`.
5. Callback ejecuta flujo descrito en Contrato de API.

## Capa de servicios

```ts
// src/lib/services/auth/oauth/facebook.ts
export function buildAuthorizationUrl(env, redirectUri: string, state: string): string
export async function exchangeCode(env, code: string, redirectUri: string): Promise<{ accessToken: string }>
export async function getProfile(accessToken: string): Promise<{ id: string; email: string; name?: string }>

// src/lib/services/auth/oauth/state.ts (reusado de HU-01.3)
// src/pages/api/v1/auth/oauth/[provider]/callback.ts (extendido para dispatch facebook)
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/oauth/facebook.test.ts` | `buildAuthorizationUrl` contiene `client_id`, `redirect_uri`, `state`, `scope=email,public_profile`, dominio `facebook.com` |
| Unit | `tests/unit/validators/oauth.test.ts` | `FacebookProfile` rechaza `id` vacío, `email` no-email |
| Integracion | `tests/integration/auth/oauth-facebook.test.ts` | callback con state válido + email → crea user + oauth_account + cookie; callback sin email → 400; callback con state inválido → 400 |
| Integracion | `tests/integration/auth/oauth-facebook-associate.test.ts` | usuario existente sin oauth_accounts Facebook → callback crea fila con provider='facebook' |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.3 (endpoint genérico `[provider]`, schema `oauthAccounts`, helper `loadAndDeleteOAuthState`, máquina `createSession`).
- **Bloquea a:** — (terminal dentro de REQ-01).
- **Recursos compartidos:** `src/pages/api/v1/auth/oauth/[provider].ts`, `src/pages/api/v1/auth/oauth/[provider]/callback.ts`, `oauthAccounts`, binding `SESSION`.

## Riesgos tecnicos

- Riesgo: Facebook API v18 deprecation → Mitigación: aislar versión en constante `FACEBOOK_API_VERSION` para bump futuro sin tocar el resto del código.
- Riesgo: `access_token` no es JWT, no se valida con JWKS → Mitigación: el `access_token` se valida implícitamente al pedir `/me`; si es inválido, Graph responde error y retornamos 502.
- Riesgo: Facebook cambia scope `email` a opcional → Mitigación: el endpoint pide `email` explícitamente; si no llega, 400 controlado.
