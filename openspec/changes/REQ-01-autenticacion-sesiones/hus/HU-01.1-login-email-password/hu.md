# HU-01.1 — Login y registro con email + password

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** vecino o prestador con email
**Quiero** registrarme e iniciar sesión con email y contraseña
**Para** acceder a mi cuenta sin depender de un proveedor social

## Criterios de aceptación (Gherkin)

### Escenario: Registro con email válido
  Dado que NO existe ningún usuario con email "ana@ejemplo.cl"
  Cuando envío `POST /api/v1/auth/register` con `{"email":"ana@ejemplo.cl","password":"Secreta123!","role":"vecino"}`
  Entonces recibo status 201
  Y la respuesta contiene `{ user: { id, email, role } }` sin el password_hash
  Y la tabla `users` tiene un nuevo registro con `password_hash` en formato argon2id

### Escenario: Registro con email duplicado
  Dado que existe un usuario con email "ana@ejemplo.cl"
  Cuando envío `POST /api/v1/auth/register` con ese mismo email
  Entonces recibo status 409
  Y la respuesta es `{ "error": "email ya registrado" }`

### Escenario: Registro con password débil
  Cuando envío `POST /api/v1/auth/register` con password "abc"
  Entonces recibo status 400
  Y el error indica los requisitos no cumplidos (mínimo 8, una mayúscula, un número)

### Escenario: Login exitoso con credenciales válidas
  Dado que existe un usuario con email "ana@ejemplo.cl" y password "Secreta123!"
  Y la cuenta está activa
  Cuando envío `POST /api/v1/auth/login` con esas credenciales
  Entonces recibo status 200
  Y la respuesta incluye `{ user: { id, email, role } }`
  Y se setea cookie `session` con flags HttpOnly + Secure + SameSite=Lax

### Escenario: Login con password incorrecto (anti-enumeración)
  Dado que existe un usuario con email "ana@ejemplo.cl"
  Cuando envío `POST /api/v1/auth/login` con password "incorrecto"
  Entonces recibo status 401 con `{ "error": "credenciales inválidas" }`
  Y NO se setea cookie

## Tareas técnicas

- [ ] Schema Drizzle `users` en `src/database/schema.ts` (id, email único, password_hash, role, status, created_at)
- [ ] Migración Drizzle en `src/database/migrations/` con seed de admin inicial
- [ ] Helper argon2id `hash` y `verify` en `src/lib/services/auth/password.ts`
- [ ] Zod schemas `RegisterBody` y `LoginBody` en `src/lib/validators/auth.ts`
- [ ] Endpoint `src/pages/api/v1/auth/register.ts`
- [ ] Endpoint `src/pages/api/v1/auth/login.ts`
- [ ] Helper `setSessionCookie` en `src/lib/utils/cookies.ts`
- [ ] Tests `tests/unit/auth/password.test.ts`, `tests/integration/auth/register.test.ts`, `tests/integration/auth/login.test.ts`, `tests/e2e/auth-flow.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
