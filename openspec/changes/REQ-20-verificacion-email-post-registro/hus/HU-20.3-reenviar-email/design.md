# Diseño técnico — HU-20.3 — Reenviar email de verificación con rate limit

**REQ padre:** REQ-20-verificacion-email-post-registro

## Modelo de datos

No introduce tablas nuevas. Reutiliza:

- `users.email_verified_at` (creada en HU-20.1).
- `email_log` (creada en HU-20.1) — agrega filas con `type='email_verify'` por cada reenvío.

### KV

- Token: igual que HU-20.1 (`email_verify:<token>`, `email_verify_user:<user_id>`).
- Rate limit:
  - `rl:verify_resend:5m:<user_id>` → contador entero, TTL 300 s.
  - `rl:verify_resend:24h:<user_id>` → contador entero, TTL 86400 s.

### Migración Drizzle

No requiere migración nueva.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 202 | Errores |
|---|---|---|---|---|---|
| `/api/v1/auth/verify-email/resend` | POST | sesión válida | `{}` (vacío) | `{ accepted: true, next_allowed_at: ISO8601 }` | 401 sin sesión, 409 `{ "error": "ya verificado" }`, 429 `{ "error": "demasiados intentos", "retry_after_seconds": number }`, 500 |

## Validaciones Zod

```ts
// src/lib/validators/auth.ts (pseudocódigo)
export const resendVerifySchema = z.object({}).strict()
// La identidad sale de Astro.locals.user — no del body.
```

## Componentes UI

### Páginas Astro

No introduce página nueva. El botón disparador vive en dos lugares ya cubiertos por otras HUs:

- `src/pages/verify-email/[token].astro` (HU-20.2), estado Expirado.
  - Mockup base: `mockups/verify-email.html:82-84`.
- `src/components/banners/EmailVerificationBanner.astro` (HU-20.4).
  - Mockup base: ver HU-20.4 (banner amarillo en `dashboard-user.html:29-39`).

### Componentes Astro reutilizables

- `src/components/auth/ResendVerifyButton.astro` — props `{ context: 'banner' | 'expired-card' }`.
  - Estilo del botón:
    - Variante `expired-card`: `mockups/verify-email.html:82-84` (botón primary full width).
    - Variante `banner`: link/botón inline pequeño dentro del banner (ver HU-20.4).
  - Islas requeridas: una isla mínima para manejar el POST y los estados visuales (loading, success "te reenviamos el correo", 429 "intenta en X minutos").

## Flujo de interacción (secuencial)

1. Usuario hace clic en "Reenviar email" (desde `mockups/verify-email.html:82` o desde el banner del dashboard).
2. La isla cliente envía `POST /api/v1/auth/verify-email/resend` con cookie de sesión.
3. Middleware `requireSession` valida sesión y carga `locals.user`.
4. Handler verifica `users.email_verified_at`:
   - Si `!= null` → 409 `{ "error": "ya verificado" }`.
5. Handler consulta rate limit:
   - `rl:verify_resend:5m:<user_id>` → si ≥ 1 → 429 con `retry_after_seconds`.
   - `rl:verify_resend:24h:<user_id>` → si ≥ 5 → 429 con mensaje "límite diario".
6. Handler invoca `emailVerify.invalidatePrevious(userId)`:
   - lee `email_verify_user:<user_id>`,
   - borra `email_verify:<token_anterior>` y `email_verify_user:<user_id>`.
7. Handler llama `emailVerify.issueToken({ userId })` (servicio compartido con HU-20.1).
8. Handler ejecuta `ctx.waitUntil(emailVerify.send({ userId, email, token }))`.
9. Handler incrementa ambos contadores de rate limit.
10. Responde 202 con `next_allowed_at` (now + 5 min).
11. Isla cliente muestra confirmación visual ("Te reenviamos el correo a tu@email").

## Capa de servicios

- `src/lib/services/auth/email-verify.ts` (compartido con HU-20.1 y HU-20.2)
  - `invalidatePrevious(userId: number) -> Promise<void>`
  - `issueToken(...)`, `send(...)` ya definidos.
- `src/lib/middleware/rate-limit.ts`
  - `checkAndIncrement(key: string, limit: number, windowSeconds: number) -> Promise<{ allowed: boolean; remaining: number; retryAfter: number }>`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/middleware/rate-limit-resend.test.ts` | Contador 5 min y 24 h, expiración correcta |
| Unit | `tests/unit/auth/email-verify-invalidate.test.ts` | Borrado de token anterior antes de emitir nuevo |
| Integración | `tests/integration/auth/verify-email-resend.test.ts` | 202 happy path, 429 segundo intento, 409 ya verificado, 401 sin sesión |
| E2E | `tests/e2e/reenviar-verificacion.spec.ts` | Usuario en dashboard → click "Reenviar" → ve confirmación → Mailpit recibe nuevo correo con token distinto |

## Dependencias y secuencia

- **Bloqueado por:** HU-20.1 (servicio + KV), middleware de sesión existente.
- **Bloquea a:** —
- **Recursos compartidos:** binding KV `SESSION`, transport mail, servicio `email-verify.ts`.

## Riesgos técnicos

- Riesgo: rate limit basado en KV con consistencia eventual permite picos puntuales. Mitigación: aceptar tolerancia ±1, monitorizar `email_log` y alertar si un `user_id` supera 7 envíos/24h.
- Riesgo: usuario cambia de email entre registro y reenvío (caso edge). Mitigación: el endpoint usa SIEMPRE `users.email` actual; si HU futura permite editarlo antes de verificar, este servicio toma el nuevo valor sin cambios.
- Riesgo: el botón en el banner se clickea repetidamente antes de actualizar UI. Mitigación: deshabilitar botón en la isla durante el fetch y mostrar countdown si llega 429.
