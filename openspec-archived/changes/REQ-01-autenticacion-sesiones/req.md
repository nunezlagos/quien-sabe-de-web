# REQ-01-autenticacion-sesiones

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Autenticación y manejo de sesión para los 3 roles (vecino, prestador, admin).
En esta fase el proyecto trabaja **solo con email + contraseña** contra un
catálogo de **usuarios demo pre-sembrados** (no hay registro público). Los
botones de Google y Facebook se renderizan en la UI como **placeholder
visual** para mantener coherencia con el producto final, pero su flujo OAuth
está diferido a una fase posterior (HU-01.3, HU-01.4 → `deferred`).
Sesiones en Cloudflare KV. Middleware global que protege rutas privadas y
expone `Astro.locals.user` cuando hay sesión activa.

## Criterios de éxito

- [ ] Un vecino/prestador/admin inicia sesión con email + password contra el seed demo.
- [ ] Logout limpia sesión en KV y cookie del cliente.
- [ ] `GET /api/v1/auth/me` devuelve 401 sin sesión y 200 con datos del usuario con sesión.
- [ ] Sesiones expiran a 14 días (configurable por env).
- [ ] Cookies con `HttpOnly`, `Secure` y `SameSite=Lax`.
- [ ] Botones "Continuar con Google / Facebook" se renderizan pero su acción es un toast "Próximamente" (sin redirección OAuth).

## Scope diferido (fuera de esta fase)

- **Registro público (`POST /auth/register`):** deshabilitado en esta fase. Los usuarios vienen del seed `seed_users_demo` (HU-01.7). El endpoint `/api/v1/auth/registro` queda implementado pero responde **410 Gone** o se documenta como no-disponible; el formulario `/registro` muestra mensaje "Registro cerrado durante la demo".
- **OAuth Google (HU-01.3):** diferido.
- **OAuth Facebook (HU-01.4):** diferido.

## Superficie técnica

### Endpoints API
- `POST /api/v1/auth/iniciar-sesion` — login email + password [público]
- `POST /api/v1/auth/registro` — registro público **deshabilitado en demo** (responde 410/403; ver HU-01.1)
- `POST /api/v1/auth/logout` — cierra sesión [sesión]
- `GET  /api/v1/auth/me` — info de sesión [sesión]

### Vistas Astro
- `/iniciar-sesion` — formulario email + password (CTA principal)
- `/registro` — mensaje "Registro cerrado durante la demo" + link a login
- `/` — modal de login con botones OAuth decorativos (sin acción) + CTA "Acceso Corporativo" → `/dashboard`
- `components/AuthButtons.astro` — botones Google/Facebook como `<button disabled>` con tooltip "Próximamente"

### Tablas Drizzle
- `users` (id, email, password_hash, role, status, created_at)
- `communes` (seed)

### Bindings Cloudflare
- `KV` (binding `SESSION`) — tokens
- `D1` — usuarios + comunas seed

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad | Estado |
|----|------|-------------|-----------|--------|
| HU-01.1 | login-email-password | Login contra seed demo; `/registro` deshabilitado | P0 | planned |
| HU-01.2 | sesion-kv-middleware | Sesión KV + middleware global + `Astro.locals.user` | P0 | planned |
| HU-01.3 | login-google-oauth | Diferido (botón visual-only) | P2 | **deferred** |
| HU-01.4 | login-facebook-oauth | Diferido (botón visual-only) | P2 | **deferred** |
| HU-01.5 | logout | Cierre sesión + invalidación KV | P0 | planned |
| HU-01.6 | endpoint-me | `GET /auth/me` para hidratar cliente | P0 | planned |
| HU-01.7 | seed-usuarios-demo | Seed con 3 usuarios (vecino, prestador, admin) + comunas | P0 | planned |
| HU-01.8 | vista-login-standalone | Mockup + vista `/iniciar-sesion` con CTA principal | P0 | planned |
| HU-01.9 | vista-registro-standalone | Mockup + vista `/registro` con mensaje "demo cerrada" | P1 | planned |

## Tests requeridos

- **Unit (Vitest):** hash/verify password, validadores Zod del body de `/auth/iniciar-sesion`, comparador contra seed.
- **Integración:** `/auth/iniciar-sesion` (credenciales válidas/inválidas/bloqueadas), `/auth/me` con y sin cookie, `/auth/logout` idempotente, `/auth/registro` → 410 Gone.
- **E2E (Playwright):** login vecino → `/dashboard` → logout → `/`. Login prestador → `/dashboard` con datos PRO. Botón Google no redirige.

## Dependencias

- **Depende de:** —
- **Habilita a:** REQ-02 a REQ-18 (toda ruta autenticada)

## Riesgos / suposiciones

- KV tiene consistencia eventual: lecturas inmediatas tras escritura pueden devolver stale. Tokens de corta vida + revalidación mitigan.
- Bloqueo por intento fallido (rate limiting) queda fuera de scope inicial; se hace en HU dedicada si métricas lo exigen.
- Cambiar el set de usuarios demo requiere re-aplicar la migración `seed_users_demo` o limpiarla con `DELETE` antes de re-seed.
