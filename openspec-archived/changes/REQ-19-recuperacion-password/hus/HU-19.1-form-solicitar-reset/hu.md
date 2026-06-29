# HU-19.1 — Solicitar reset de contraseña por email

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-19-recuperacion-password

## Historia de usuario

**Como** usuario que olvidó su contraseña
**Quiero** ingresar mi email y recibir un link de reset
**Para** recuperar el acceso a mi cuenta

## Criterios de aceptación (Gherkin)

### Escenario: Email válido recibe link
  Dado un usuario con email "vecino@example.com" registrado
  Cuando envío `POST /api/v1/auth/forgot-password` con `{"email":"vecino@example.com"}`
  Entonces recibo status 202
  Y existe key KV `pwreset:<token>` con TTL 1800 s
  Y `email_log` registra envío tipo `password_reset`

### Escenario: Email no registrado responde 202 igualmente
  Cuando envío email inexistente
  Entonces recibo status 202 sin revelar existencia (anti-enumeración)

### Escenario: Rate limit por email → 429
  Dado 3 solicitudes previas en la última hora para el mismo email
  Cuando envío una 4ta
  Entonces recibo status 429 con `{ "error": "demasiadas solicitudes" }`

### Escenario: UI muestra confirmación neutra
  Cuando completo el form `/forgot-password` (estilo `mockups/forgot-password.html` card blanca)
  Entonces veo mensaje "Si el email existe, recibirás instrucciones"

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/forgot-password.ts` con Zod `{ email: z.string().email() }`
- [ ] Helper `generateResetToken()` en `src/lib/services/auth/reset-token.ts` (32 bytes hex)
- [ ] Persistir en KV `SESSION` con prefijo `pwreset:` TTL 1800
- [ ] Encolar email vía servicio REQ-17 (`src/lib/services/email/send.ts`) template `password_reset`
- [ ] Rate limiter compartido en `src/lib/middleware/rate-limit.ts` (3/hora por email, 5/hora por IP)
- [ ] Vista Astro `src/pages/forgot-password.astro` siguiendo estilo `mockups/forgot-password.html` (card `bg-white rounded-3xl shadow-sm border border-gray-100`)
- [ ] Tests `tests/unit/auth/reset-token.test.ts`, `tests/integration/auth/forgot-password.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
