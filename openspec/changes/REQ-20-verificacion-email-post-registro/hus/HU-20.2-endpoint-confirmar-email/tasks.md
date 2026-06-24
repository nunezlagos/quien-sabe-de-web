# HU-20.2 — Confirmar email con token

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-20-verificacion-email-post-registro
**Rama:** `feat/HU-20.2-endpoint-confirmar-email`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/auth/email-verify.ts` extender con `confirm(token)` y `revokeToken(token)`. Lanza `TokenExpiredError` si el token no existe.
- [ ] **T2** Validador `verifyTokenParamSchema` en `src/lib/validators/auth.ts` (regex 64 hex).
- [ ] **T3] Endpoint `src/pages/api/v1/auth/verify-email/[token].ts` (GET, público):
  - Valida token con Zod → 400 si falla.
  - `emailVerify.confirm(token)` → 410 si `TokenExpiredError`.
  - Si `alreadyVerified: true` → 200 + borra KV + retorna `{already_verified: true}`.
  - Si nuevo → `UPDATE users SET email_verified_at = NOW()` (con COALESCE para race), borra KV, retorna 200.
- [ ] **T4** Invalidar cache de sesión KV con TTL 60-120s en HU-20.4 — agregar helper `invalidateSessionCache(userId)` en el servicio compartido.
- [ ] **T5** Componente `src/components/auth/VerifyEmailCard.astro` con props `{state: 'success' | 'expired', userId?}`. Mockup `mockups/verify-email.html:59-71` (success) y `:74-87` (expired).
- [ ] **T6** Página `src/pages/verify-email/[token].astro` — SSR. Llama internamente `emailVerify.confirm(token)` (no HTTP). Renderiza `VerifyEmailCard` con estado correspondiente. Layout `BaseLayout.astro`.
- [ ] **T7** Si `confirm` lanza `TokenExpiredError` → setear status HTTP 410 con headers y renderizar expired.
- [ ] **T8** Tests:
  - [ ] `tests/unit/auth/email-verify-confirm.test.ts` — token válido, expirado, ya verificado; race con UPDATE COALESCE.
  - [ ] `tests/unit/validators/verify-token-param.test.ts` — regex 64 hex acepta/rechaza correctamente.
  - [ ] `tests/integration/auth/verify-email-confirm.test.ts` — endpoint GET → 200 + `email_verified_at` set; 410 token inexistente; 400 token mal formado; idempotencia (segunda llamada = already_verified).
  - [ ] `tests/e2e/confirmar-email-flujo.spec.ts` — registro → captura URL en Mailpit → visita → ve botón "Ir a mi dashboard".

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `confirm`, usar `UPDATE users SET email_verified_at = ?` sin COALESCE → segundo click sobreescribe timestamp, race condition detectable en test → restaurar
- [ ] Sabotaje 2: no borrar el token KV tras confirmar → token puede reutilizarse, test idempotencia rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/email-verify.ts` (rama confirm)
- [ ] Type check verde
- [ ] Commit `feat: endpoint confirmar email` y push