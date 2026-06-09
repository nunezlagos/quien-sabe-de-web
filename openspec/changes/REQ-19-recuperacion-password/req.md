# REQ-19-recuperacion-password

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Flujo completo "Olvidé mi contraseña" para usuarios autenticados por email +
password. Genera token de un solo uso con TTL, envía por SES/Mailpit, valida
y permite resetear el password. Invalida todas las sesiones KV vivas del
usuario al confirmar el cambio.

## Criterios de éxito

- [ ] Usuario solicita reset por email y recibe link en su bandeja.
- [ ] Token TTL 30 min, un solo uso, almacenado en KV con prefijo `pwreset:`.
- [ ] Cambio de password invalida TODAS las sesiones del usuario (KV scan).
- [ ] Rate-limit 3 solicitudes / hora por email + 5 / hora por IP.
- [ ] Logs en `email_log` con tipo `password_reset`.

## UI pendiente

No existe mockup específico. Diseñar bajo el estilo visual de
`mockups/verification.html` (cards blancas con sombras suaves, primary
`#2E8B57`, botones `rounded-xl`):

- `/forgot-password` — form con email único.
- `/reset/:token` — form nuevo password + confirmación, con indicador de
  fuerza.
- Estado "Token inválido o expirado" reutilizando estilo de
  `mockups/profile.html` sección `#profile-error` (línea 153-156).

## Superficie técnica

### Endpoints API
- `POST /api/v1/auth/forgot-password` — pide email [público]
- `GET  /api/v1/auth/reset/:token` — valida token [público]
- `POST /api/v1/auth/reset` — body `{token, new_password}` [público]

### Vistas Astro
- `/forgot-password`, `/reset/[token]`

### Tablas Drizzle / KV
- KV `SESSION` keys `pwreset:<token>` → `{user_id, expires_at}`
- Tabla `email_log` (ya existente REQ-17) registra envío.

### Bindings Cloudflare
- `D1`, `SESSION` (KV), `SES`/Mailpit

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-19.1 | form-solicitar-reset | POST forgot-password + email | P0 |
| HU-19.2 | endpoint-reset-token | GET valida token vigente | P0 |
| HU-19.3 | form-nuevo-password | POST reset con token + password | P0 |
| HU-19.4 | invalidacion-sesiones-tras-reset | Scan KV y revocar sesiones | P0 |

## Tests requeridos

- **Unit:** generador de token (entropía, longitud), validador Zod del body.
- **Integración:** flujo completo con KV mock, expiración, doble uso, rate-limit.
- **E2E:** vecino solicita reset → abre email Mailpit → reset → puede login.

## Dependencias

- **Depende de:** REQ-01, REQ-17
- **Habilita a:** —

## Riesgos / suposiciones

- Token único en KV; alternativa con tabla `password_reset_tokens` descartada
  por costo D1.
- No revelar si el email existe (siempre 202 en `forgot-password`).
