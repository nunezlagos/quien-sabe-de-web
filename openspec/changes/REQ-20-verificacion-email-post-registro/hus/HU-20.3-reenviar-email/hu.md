# HU-20.3 — Reenviar email de verificación con rate limit

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-20-verificacion-email-post-registro

## Historia de usuario

**Como** usuario que no recibió el email
**Quiero** solicitar un reenvío
**Para** completar la verificación

## Criterios de aceptación (Gherkin)

### Escenario: Reenvío válido
  Dado usuario logueado sin verificar
  Cuando envío `POST /api/v1/auth/verify-email/resend`
  Entonces recibo status 202
  Y se genera nuevo token (invalidando anterior)
  Y se manda nuevo correo

### Escenario: Rate limit 1 por 5 min → 429
  Dado un reenvío en los últimos 5 min
  Cuando envío otro
  Entonces recibo status 429

### Escenario: Ya verificado → 409
  Cuando usuario ya verificado envía resend
  Entonces recibo status 409 con `{ "error": "ya verificado" }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/verify-email/resend.ts`
- [ ] Rate-limit en `src/lib/middleware/rate-limit.ts` clave `verify_resend:<user_id>`
- [ ] Invalidar token anterior (KV delete) antes de generar nuevo
- [ ] Tests `tests/integration/auth/verify-email-resend.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
