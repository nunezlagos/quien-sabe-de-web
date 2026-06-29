# Diseno tecnico — HU-01.2 — Sesión en KV + middleware global con Astro.locals.user

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

### Entradas en Cloudflare KV (binding `SESSION`)

| Key | Value (JSON) | TTL |
|---|---|---|
| `session:<token>` | `{ user_id: number, role: 'vecino'\|'prestador'\|'admin', status: 'active'\|'pending'\|'banned', exp: number }` | `SESSION_TTL_DAYS * 86400` segundos |

`token` = 32 bytes random (`crypto.getRandomValues`) → hex 64 chars.

### Tipos compartidos

```ts
// src/types/session.ts
export type SessionPayload = {
  user_id: number
  role: 'vecino' | 'prestador' | 'admin'
  status: 'active' | 'pending' | 'banned'
  exp: number  // unix epoch seconds
}
```

### Extensión de `App.Locals`

```ts
// src/env.d.ts
declare namespace App {
  interface Locals {
    user?: {
      id: number
      email: string
      role: 'vecino' | 'prestador' | 'admin'
      status: 'active' | 'pending' | 'banned'
    }
    runtime: {
      env: {
        DB: D1Database
        SESSION: KVNamespace
        SESSION_TTL_DAYS?: string  // opcional, default "14"
      }
    }
  }
}
```

## Contrato de API

No aplica. Esta HU define comportamiento de middleware, no endpoints nuevos. Los endpoints que consumen `locals.user` viven en HU-01.5, HU-01.6 y el resto de REQs.

## Validaciones Zod

```ts
// src/lib/validators/session.ts
export const SessionPayloadSchema = z.object({
  user_id: z.number().int().positive(),
  role: z.enum(['vecino', 'prestador', 'admin']),
  status: z.enum(['active', 'pending', 'banned']),
  exp: z.number().int().positive(),
})
```

## Componentes UI

No aplica (HU backend).

## Flujo de interaccion (secuencial)

### Creación de sesión (consumido por HU-01.1, HU-01.3, HU-01.4)

1. `createSession(env, user)` genera `token = randomHex(32)`.
2. Calcula `ttlSeconds = (env.SESSION_TTL_DAYS ? Number(env.SESSION_TTL_DAYS) : 14) * 86400`.
3. `env.SESSION.put('session:' + token, JSON.stringify({ user_id, role, status, exp: now + ttlSeconds }), { expirationTtl: ttlSeconds })`.
4. Retorna `{ token, ttlSeconds }` al caller para que setee la cookie.

### Hidratación por middleware (cada request)

1. `src/middleware.ts` lee cookie `session` con `AstroCookies.get('session')`.
2. Si no hay cookie → `locals.user = undefined`, `next()`.
3. `env.SESSION.get('session:' + token)` (con manejo de excepción: log + tratar como inexistente).
4. Si no existe → borrar cookie (Set-Cookie Max-Age=0), `locals.user = undefined`, `next()`.
5. Parsear JSON y validar con `SessionPayloadSchema`. Si falla o `exp < now` → borrar cookie, `locals.user = undefined`, `next()`.
6. Lookup `users` por `user_id` para enriquecer con `email` (snapshot consistente con DB actual, evita servir email desactualizado si el role/status cambió).
7. Si `users.status === 'banned'` → `destroySession`, borrar cookie, `locals.user = undefined`.
8. `locals.user = { id, email, role, status }`, `next()`.

## Capa de servicios

```ts
// src/lib/services/auth/session.ts
export async function createSession(env, user: User): Promise<{ token: string; ttlSeconds: number }>
export async function readSession(env, token: string): Promise<SessionPayload | null>
export async function destroySession(env, token: string): Promise<void>
export function getSessionTtlSeconds(env): number  // lee SESSION_TTL_DAYS con default 14
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/session.test.ts` | `createSession` genera token 64-char hex, `getSessionTtlSeconds` parsea env correcto y default 14 |
| Unit | `tests/unit/middleware/session.test.ts` | parser `SessionPayloadSchema` rechaza JSON inválido, `exp` expirado |
| Integracion | `tests/integration/auth/middleware.test.ts` | cookie válida hidrata `locals.user`, cookie inválida → undefined + cookie borrada, token expirado → 401 en ruta protegida |
| Integracion | `tests/integration/auth/session-ttl.test.ts` | `SESSION_TTL_DAYS=7` → `expirationTtl=604800` en la key KV |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users` necesaria para enriquecer `locals.user` con email).
- **Bloquea a:** HU-01.5 (logout usa `destroySession`), HU-01.6 (`/me` lee `locals.user`), REQ-02 (middleware onboarding), todas las rutas autenticadas.
- **Recursos compartidos:** binding `SESSION` (KV), `src/middleware.ts`, `src/env.d.ts`, `src/lib/utils/cookies.ts` (de HU-01.1).

## Riesgos tecnicos

- Riesgo: KV stale read tras login → Mitigación: el caller que crea la sesión (login) lee su propia escritura antes de devolver; el resto del sistema tolera hasta 60s de stale en logout (acceptable para UX).
- Riesgo: middleware se rompe y toda la app cae → Mitigación: try/catch alrededor de `env.SESSION.get`, log + seguir con `locals.user = undefined`. Endpoints críticos defienden en profundidad.
- Riesgo: tipo `App.Locals.user` queda como `any` por no actualizar `env.d.ts` → Mitigación: el test E2E y los endpoints usan `Astro.locals.user.id` — TS falla si el tipo no está bien.
