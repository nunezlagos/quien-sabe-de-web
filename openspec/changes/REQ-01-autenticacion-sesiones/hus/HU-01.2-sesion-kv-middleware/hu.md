# HU-01.2 — Sesión KV + middleware global con Astro.locals.user

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** usuario autenticado
**Quiero** que mi sesión persista en Cloudflare KV y esté disponible en cada request
**Para** que el resto de la app reciba `Astro.locals.user` sin re-consultar la base

## Criterios de aceptación (Gherkin)

### Escenario: Login exitoso crea token en KV
  Dado un login exitoso para `vecino@demo.cl`
  Cuando se ejecuta el handler de login
  Entonces se escribe en KV (binding `SESSION`) una entrada `session:<token>` con `{ user_id, role, exp, email_verified_at }`
  Y la TTL en KV es 14 días
  Y la cookie `session` recibe el token opaco

### Escenario: Middleware hidrata Astro.locals.user
  Dado un request con cookie `session=<token>` válido en KV
  Cuando el middleware `src/middleware.ts` se ejecuta
  Entonces `Astro.locals.user` queda con `{ id, email, name, role, status, email_verified_at }`
  Y el request continúa hacia el handler

### Escenario: Cookie inválida no rompe el request
  Dado un request con cookie `session=<token-inexistente>`
  Cuando pasa por el middleware
  Entonces `Astro.locals.user` queda `undefined`
  Y el handler decide si exigir auth o no

### Escenario: Sesión expirada devuelve 401 en rutas protegidas
  Dado un token con `exp` en el pasado
  Cuando se accede a `GET /api/v1/auth/me`
  Entonces recibo status 401
  Y la cookie es limpiada (Set-Cookie con Max-Age=0)

### Escenario: TTL de sesión configurable por env
  Dado `SESSION_TTL_DAYS=7` en el binding
  Cuando se crea una nueva sesión
  Entonces la TTL en KV refleja 7 días en segundos

## Tareas técnicas

- [ ] Helper `createSession(user)` en `src/lib/services/auth/session.ts` que escribe en `locals.runtime.env.SESSION`
- [ ] Helper `readSession(token)` con manejo de stale reads de KV
- [ ] Middleware global en `src/middleware.ts` que pobla `Astro.locals.user`
- [ ] Tipado de `Astro.locals.user` en `src/env.d.ts`
- [ ] Lectura de `SESSION_TTL_DAYS` desde `Astro.locals.runtime.env`
- [ ] Tests `tests/unit/auth/session.test.ts` y `tests/integration/auth/middleware.test.ts` con `@cloudflare/vitest-pool-workers`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
