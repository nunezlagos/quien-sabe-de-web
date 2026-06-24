# HU-19.2 — Validar token de reset vigente

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-19-recuperacion-password

## Historia de usuario

**Como** usuario con link de reset
**Quiero** que la plataforma valide el token antes de mostrarme el form
**Para** no perder tiempo si el link expiró

## Criterios de aceptación (Gherkin)

### Escenario: Token válido devuelve 200
  Dado un token con KV `pwreset:abc123` vigente
  Cuando hago `GET /api/v1/auth/reset/abc123`
  Entonces recibo status 200 con `{ "valid": true, "user_email_masked": "ve***@example.com" }`

### Escenario: Token inexistente → 410
  Cuando hago GET con token desconocido
  Entonces recibo status 410 con `{ "error": "token inválido o expirado" }`

### Escenario: Token expirado (TTL vencido) → 410
  Dado un token cuyo TTL ya pasó
  Cuando hago GET
  Entonces recibo status 410

### Escenario: Vista `/reset/:token` muestra estado de error
  Cuando el token es inválido y se carga `/reset/abc123`
  Entonces se renderiza el estado de error reutilizando estilo de `mockups/profile.html` líneas 166-169 (`#profile-error`)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/reset/[token].ts`
- [ ] Helper `getResetToken(token)` que lee KV y valida expiración
- [ ] Función `maskEmail(email)` en `src/lib/utils/mask.ts`
- [ ] Vista Astro `src/pages/reset/[token].astro` con SSR fetch del endpoint
- [ ] Estilo de error idéntico al patrón `mockups/profile.html:166` (centrado, texto gris, CTA volver)
- [ ] Tests `tests/unit/utils/mask.test.ts`, `tests/integration/auth/reset-token-validate.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
