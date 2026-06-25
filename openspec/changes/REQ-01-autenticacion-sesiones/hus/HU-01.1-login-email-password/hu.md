# HU-01.1 — Inicio de sesión con email + contraseña (registro público deshabilitado)

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** vecino, prestador o admin pre-registrado en el seed demo
**Quiero** iniciar sesión con email y contraseña
**Para** acceder a mi cuenta sin depender de un proveedor social

## Contexto

En esta fase el registro público está deshabilitado (ver HU-01.9). Los
usuarios vienen del seed `seed_users_demo` (HU-01.7). El endpoint
`POST /api/v1/auth/registro` responde **410 Gone**.

## Criterios de aceptación (Gherkin)

### Escenario: Inicio de sesión exitoso con credenciales válidas
  Dado que existe el usuario `vecino@demo.cl` con password `Demo1234` (del seed HU-01.7)
  Cuando envío `POST /api/v1/auth/iniciar-sesion` con `{"email":"vecino@demo.cl","password":"Demo1234"}`
  Entonces recibo status 200
  Y la respuesta incluye `{ user: { id, email, role, name } }` (sin `password_hash`)
  Y se setea cookie `session` con flags HttpOnly + Secure + SameSite=Lax

### Escenario: Inicio de sesión con credenciales inválidas (anti-enumeración)
  Dado que existe el usuario `vecino@demo.cl`
  Cuando envío `POST /api/v1/auth/iniciar-sesion` con password incorrecto
  Entonces recibo status 401 con `{ "error": "credenciales inválidas" }`
  Y NO se setea cookie
  Y el response time es similar al de "usuario no existe" (anti-timing-attack)

### Escenario: Inicio de sesión con cuenta deshabilitada (banned)
  Dado un usuario con `status="banned"`
  Cuando envío `POST /api/v1/auth/iniciar-sesion` con sus credenciales
  Entonces recibo status 403 con `{ "error": "cuenta deshabilitada" }`
  Y NO se setea cookie

### Escenario: Validación de body (email faltante)
  Cuando envío `POST /api/v1/auth/iniciar-sesion` con `{"password":"Demo1234"}` (sin email)
  Entonces recibo status 400 con `{ "error": "email requerido" }`

### Escenario: Endpoint de registro público responde 410
  Cuando envío `POST /api/v1/auth/registro` con cualquier body
  Entonces recibo status 410 con `{ "error": "registro deshabilitado en esta fase" }`
  Y NO se crea fila en `users`

## Tareas técnicas

- [ ] Schema Drizzle `users` en `src/database/schema.ts` (id, email único, password_hash, role, status, created_at)
- [ ] Migración Drizzle en `src/database/migrations/` agregando columna `password_hash`
- [ ] Helper PBKDF2 `hash` y `verify` en `src/lib/services/auth/contrasena.ts` (Web Crypto)
- [ ] Zod schemas `InicioSesionCuerpo` (login) en `src/lib/validators/autenticacion.ts` — el schema `RegistroCuerpo` queda declarado pero NO se usa en esta fase
- [ ] Endpoint `src/pages/api/v1/auth/iniciar-sesion.ts` (login contra seed `users_demo`)
- [ ] Endpoint `src/pages/api/v1/auth/registro.ts` → responde **410 Gone** en esta fase (registro público deshabilitado; ver HU-01.9)
- [ ] Helper `establecerCookieSesion` en `src/lib/utils/cookies.ts`
- [ ] Vista `src/pages/iniciar-sesion.astro` refactorizada:
  - Sin `style="..."` inline (regla R1)
  - JS del form extraído a `src/lib/client/auth/login.ts` (regla R2)
  - `<script>` inline solo importa e invoca `inicializarFormularioLogin()`
- [ ] Componente reutilizable `src/components/auth/AuthButtons.astro` para los botones Google/Facebook visual-only (regla R3; usado en modal de `index.astro` + futuras vistas)
- [ ] Toast/alert "Próximamente" en `src/lib/client/ui/toast.ts` (reutilizable para OAuth diferido y features futuras)
- [ ] Tests `tests/unit/auth/contrasena.test.ts`, `tests/integration/auth/iniciar-sesion.test.ts` (válido/inválido/bloqueado/seed), `tests/integration/auth/registro-410.test.ts`, `tests/e2e/flujo-auth.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] `grep -rn 'style="' src/pages src/components src/layouts` → **0 ocurrencias** (regla R1)
- [ ] `grep -rn '<script>' src/pages src/components src/layouts` → solo imports o hidratación trivial (regla R2)
- [ ] PR mergeado a `develop` vía `/respaldo`