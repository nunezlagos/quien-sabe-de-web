# HU-20.2 — Confirmar email con token

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-20-verificacion-email-post-registro

## Historia de usuario

**Como** usuario recién registrado
**Quiero** confirmar mi email haciendo clic en el link
**Para** desbloquear todas las acciones de la plataforma

## Criterios de aceptación (Gherkin)

### Escenario: Token válido marca verified_at
  Dado token vigente `xyz789` para user_id=42
  Cuando hago `GET /api/v1/auth/verify-email/xyz789`
  Entonces recibo status 200
  Y `users.email_verified_at` queda con timestamp actual
  Y key KV `email_verify:xyz789` eliminada

### Escenario: Token expirado → 410
  Dado token con TTL vencido
  Cuando hago GET
  Entonces recibo status 410
  Y vista `/verify-email/:token` muestra estado error con CTA "Reenviar" (estilo `mockups/profile.html:166-169`)

### Escenario: Ya verificado → 200 idempotente
  Dado user con `email_verified_at` no nulo
  Cuando hace GET con token (vigente o no)
  Entonces recibo status 200 con `{ "already_verified": true }`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/verify-email/[token].ts`
- [ ] Vista Astro `src/pages/verify-email/[token].astro` con SSR + estados verde/rojo
- [ ] Update Drizzle de `users.email_verified_at`
- [ ] Tests `tests/integration/auth/verify-email-confirm.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
