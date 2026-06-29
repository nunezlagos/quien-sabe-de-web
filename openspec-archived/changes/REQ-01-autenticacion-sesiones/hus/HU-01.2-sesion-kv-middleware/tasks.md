# HU-01.2 — Sesión KV + middleware global con Astro.locals.user

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.2-sesion-kv-middleware`

## Tareas tecnicas

- [ ] **T1** Implementar `src/lib/services/auth/session.ts` con `createSession(env, user)`, `readSession(env, token)`, `destroySession(env, token)`, `getSessionTtlSeconds(env)` (lee `SESSION_TTL_DAYS` con default 14).
- [ ] **T2** Generador `randomToken(bytes = 32)` en `src/lib/utils/crypto.ts` usando `crypto.getRandomValues` + hex.
- [ ] **T3** Zod schema `SessionPayloadSchema` en `src/lib/validators/session.ts`.
- [ ] **T4** Extender `src/env.d.ts` con `App.Locals.user` y `App.Locals.runtime.env.SESSION` + opcional `SESSION_TTL_DAYS`.
- [ ] **T5** Middleware global `src/middleware.ts`: lee cookie `session`, hace `readSession`, enriquece con email desde `users`, popula `locals.user`. Si token inválido/expirado/usuario banned → borra cookie y sigue con `locals.user = undefined`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/auth/session.test.ts` — `createSession` retorna token de 64 chars hex; `getSessionTtlSeconds` parsea `SESSION_TTL_DAYS=7` → 604800 y default → 1209600.
  - [ ] `tests/unit/middleware/session.test.ts` — `SessionPayloadSchema` rechaza payload sin `exp`, `exp` en el pasado, `role` fuera de enum.
  - [ ] `tests/integration/auth/middleware.test.ts` — cookie válida hidrata `locals.user`; cookie con token inexistente → `locals.user === undefined` + cookie borrada; usuario banned → sesión destruida + cookie borrada; `next()` se invoca en orden correcto.
  - [ ] `tests/integration/auth/session-ttl.test.ts` — `createSession` con `SESSION_TTL_DAYS=1` escribe key KV con `expirationTtl=86400`.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: en `readSession`, ignorar el check de `exp` (eliminar `if (payload.exp < now) return null`) → test `Sesión expirada devuelve 401` (de HU-01.6 cuando exista) o test unitario del parser con `exp` viejo debe caer → restaurar.
- [ ] **Sabotaje 2**: cambiar `env.SESSION.delete('session:' + token)` por un no-op en `destroySession` → test de logout (HU-01.5) debe detectar que la key sigue en KV → restaurar.
- [ ] **Sabotaje 3**: comentar la línea `locals.user = ...` en el middleware → tests de integración que esperan `locals.user` poblado caen con `undefined` → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/auth/session.ts` y `src/middleware.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.2-sesion-kv-middleware` (no merge a main sin review)
