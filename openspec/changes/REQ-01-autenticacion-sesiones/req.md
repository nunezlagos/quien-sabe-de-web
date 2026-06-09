# REQ-01-autenticacion-sesiones

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Autenticación y manejo de sesión para los 3 roles (vecino, prestador, admin).
Soporta login social (Google, Facebook) y email + contraseña. Sesiones en
Cloudflare KV. Middleware global que protege rutas privadas y expone
`Astro.locals.user` cuando hay sesión activa.

## Criterios de éxito

- [ ] Un vecino se registra e inicia sesión con email + password.
- [ ] Login con Google y Facebook crean (o asocian) cuenta correctamente.
- [ ] Logout limpia sesión en KV y cookie del cliente.
- [ ] `GET /api/v1/auth/me` devuelve 401 sin sesión y 200 con datos del usuario con sesión.
- [ ] Sesiones expiran a 14 días (configurable por env).
- [ ] Cookies con `HttpOnly`, `Secure` y `SameSite=Lax`.

## Superficie técnica

### Endpoints API
- `POST /api/v1/auth/register` — registro email + password [público]
- `POST /api/v1/auth/login` — login email + password [público]
- `GET  /api/v1/auth/oauth/:provider` — inicia OAuth [público]
- `GET  /api/v1/auth/oauth/:provider/callback` — callback OAuth [público]
- `POST /api/v1/auth/logout` — cierra sesión [sesión]
- `GET  /api/v1/auth/me` — info de sesión [sesión]

### Vistas Astro
- `/login`, `/register` — formularios + botones sociales

### Tablas Drizzle
- `users` (id, email, password_hash, role, status, created_at)
- `oauth_accounts` (user_id, provider, provider_user_id)

### Bindings Cloudflare
- `KV` (binding `SESSION`) — tokens
- `D1` — usuarios

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-01.1 | login-email-password | Registro + login básico con hash argon2 | P0 |
| HU-01.2 | sesion-kv-middleware | Sesión KV + middleware global + `Astro.locals.user` | P0 |
| HU-01.3 | login-google-oauth | Flujo OAuth Google con state/PKCE | P1 |
| HU-01.4 | login-facebook-oauth | Flujo OAuth Facebook | P1 |
| HU-01.5 | logout | Cierre sesión + invalidación KV | P0 |
| HU-01.6 | endpoint-me | `GET /auth/me` para hidratar cliente | P0 |

## Tests requeridos

- **Unit (Vitest):** hash/verify password, generador y parser de tokens, validadores Zod del body de `/auth/login` y `/auth/register`.
- **Integración:** `/auth/register` (email duplicado, password débil), `/auth/login` (credenciales válidas/inválidas/bloqueadas), `/auth/me` con y sin cookie, `/auth/logout` idempotente, callback OAuth con `state` válido/inválido.
- **E2E (Playwright):** registro → login → /dashboard-user → logout → / (sin sesión).

## Dependencias

- **Depende de:** —
- **Habilita a:** REQ-02 a REQ-18 (toda ruta autenticada)

## Riesgos / suposiciones

- OAuth requiere credenciales reales en prod (Google Cloud Console, Facebook Developers).
- KV tiene consistencia eventual: lecturas inmediatas tras escritura pueden devolver stale. Tokens de corta vida + revalidación mitigan.
- Bloqueo por intento fallido (rate limiting) queda fuera de scope inicial; se hace en HU dedicada si métricas lo exigen.
