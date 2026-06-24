# Diseno tecnico — HU-01.3 — Login con Google OAuth (state + PKCE)

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

### Tabla Drizzle

```ts
// src/database/schema.ts (extracto)
export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google', 'facebook'] }).notNull(),
  providerUserId: text('provider_user_id').notNull(),  // 'sub' del id_token
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  uniqProvider: uniqueIndex('idx_oauth_provider_unique').on(t.provider, t.providerUserId),
  byUser: index('idx_oauth_user').on(t.userId),
}))
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0003_oauth_accounts.sql`.
- Cambios:
  - `CREATE TABLE oauth_accounts (...)` con `CHECK (provider IN ('google','facebook'))`.
  - `CREATE UNIQUE INDEX idx_oauth_provider_unique ON oauth_accounts(provider, provider_user_id);`
  - `CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);`
  - FK a `users(id)` con `ON DELETE CASCADE`.

### Entradas en KV (binding `SESSION`)

| Key | Value | TTL |
|---|---|---|
| `oauth:state:<state>` | `{ codeVerifier: string, provider: 'google', redirectAfter: string }` | 600s |

## Contrato de API

### `GET /api/v1/auth/oauth/google` [público]

Response: 302 hacia `https://accounts.google.com/o/oauth2/v2/auth?...&state=<random>&code_challenge=<s256(verifier)>&code_challenge_method=S256&scope=openid+email+profile&redirect_uri=<callback>&client_id=<GOOGLE_OAUTH_CLIENT_ID>`.

### `GET /api/v1/auth/oauth/google/callback?code=...&state=...` [público]

Flujo interno:
1. Lee `oauth:state:<state>` de KV → si no existe → 400 `state inválido`.
2. POST a `https://oauth2.googleapis.com/token` con `code`, `code_verifier`, `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`.
3. Recibe `id_token`, valida firma contra JWKS, valida `iss`, `aud`, `exp`.
4. Extrae `email` y `sub` (= `provider_user_id`).
5. Busca `oauth_accounts` por `(provider='google', provider_user_id=sub)`.
   - Si existe → carga `user`, llama `createSession`, redirige a `redirectAfter` con cookie.
   - Si no existe → busca `users` por `email`.
     - Si existe → crea `oauth_accounts` (asocia), `createSession`, redirige.
     - Si no existe → crea `users` con `role='vecino'` y `passwordHash='OAUTH_NO_PASSWORD'` (placeholder, login por password deshabilitado), crea `oauth_accounts`, `createSession`, redirige a `/onboarding`.
6. `DELETE oauth:state:<state>` (one-shot).

Errores: 400 `state inválido`, 400 `email requerido`, 502 si Google responde error.

## Validaciones Zod

```ts
// src/lib/validators/oauth.ts
export const OAuthCallbackQuery = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(16).max(256),
})

export const GoogleIdTokenClaims = z.object({
  iss: z.literal('https://accounts.google.com'),
  aud: z.string(),
  sub: z.string(),
  email: z.string().email(),
  email_verified: z.boolean(),
  exp: z.number().int().positive(),
})
```

## Componentes UI

- Botón "Continuar con Google" en `src/pages/login.astro` (HU-01.1) que enlaza a `/api/v1/auth/oauth/google`.
- Variables de entorno documentadas en `wrangler.toml.example`:
  ```
  GOOGLE_OAUTH_CLIENT_ID = "<your-client-id>"
  GOOGLE_OAUTH_CLIENT_SECRET = "<your-client-secret>"
  ```

## Flujo de interaccion (secuencial)

1. Click en botón → `GET /api/v1/auth/oauth/google`.
2. Helper `google.buildAuthorizationUrl(env, redirectUri)`:
   - Genera `state = randomHex(32)` y `codeVerifier = randomBase64Url(64)`.
   - Calcula `codeChallenge = base64url(sha256(codeVerifier))`.
   - KV `put('oauth:state:<state>', { codeVerifier, provider: 'google', redirectAfter: '/onboarding' }, { expirationTtl: 600 })`.
   - Retorna URL completa con `scope=openid email profile`.
3. Google autentica al usuario y redirige a callback con `code` y `state`.
4. `GET /api/v1/auth/oauth/google/callback?code=...&state=...` ejecuta el flujo descrito en Contrato de API.

## Capa de servicios

```ts
// src/lib/services/auth/oauth/google.ts
export function buildAuthorizationUrl(env, redirectUri: string, state: string, codeChallenge: string): string
export async function exchangeCode(env, code: string, codeVerifier: string, redirectUri: string): Promise<{ idToken: string }>
export async function verifyIdToken(idToken: string, env): Promise<GoogleIdTokenClaims>

// src/lib/services/auth/oauth/pkce.ts
export function generateCodeVerifier(): string   // base64url 64 chars
export function generateCodeChallenge(verifier: string): string  // base64url(sha256)
export function generateState(): string          // hex 64 chars

// src/lib/services/auth/oauth/state.ts
export async function saveOAuthState(env, state: string, payload: { codeVerifier: string, provider: 'google' | 'facebook', redirectAfter: string }): Promise<void>
export async function loadAndDeleteOAuthState(env, state: string): Promise<... | null>
```

Endpoint genérico `src/pages/api/v1/auth/oauth/[provider].ts` resuelve el provider y delega a `google.ts` o `facebook.ts`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/oauth/pkce.test.ts` | `generateCodeChallenge(sha256(verifier))` determinístico |
| Unit | `tests/unit/auth/oauth/google.test.ts` | `buildAuthorizationUrl` incluye `state`, `code_challenge`, `code_challenge_method=S256`, `scope=openid+email+profile`, `client_id` |
| Unit | `tests/unit/validators/oauth.test.ts` | `GoogleIdTokenClaims` rechaza `iss` distinto, `email` no-email |
| Integracion | `tests/integration/auth/oauth-google.test.ts` | callback con state válido → crea user + oauth_account + cookie; callback con state inválido → 400; callback con email ya asociado a oauth_account → solo crea sesión |
| Integracion | `tests/integration/auth/oauth-google-associate.test.ts` | usuario existente sin oauth_accounts → callback crea oauth_accounts y NO duplica users |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users`), HU-01.2 (sesión KV + `createSession`).
- **Bloquea a:** HU-01.4 (mismo endpoint genérico, sólo cambia el helper del provider).
- **Recursos compartidos:** `oauthAccounts` schema, `src/pages/api/v1/auth/oauth/[provider].ts`, binding `SESSION` para `oauth:state:*`.

## Riesgos tecnicos

- Riesgo: `client_secret` leak en logs → Mitigación: nunca loggear el body completo del `token` endpoint; redactar campos sensibles.
- Riesgo: JWKS de Google cambia y cache se stale → Mitigación: fetch JWKS on-demand con cache de 1h; verificar firma con `kid`.
- Riesgo: rate limit en `oauth2.googleapis.com/token` → Mitigación: el endpoint es user-initiated, no hot path; documentar límite en `wrangler.toml.example`.
