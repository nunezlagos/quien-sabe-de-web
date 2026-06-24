# HU-20.3 — Reenviar email de verificación con rate limit

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-20-verificacion-email-post-registro
**Rama:** `feat/HU-20.3-reenviar-email`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/auth/email-verify.ts` extender con `invalidatePrevious(userId)`: lee `emailVerifyUser:<userId>`, borra ambas claves KV.
- [ ] **T2] Helper `src/lib/middleware/rate-limit.ts` (o extender REQ-08) con `checkAndIncrement(key, limit, windowSeconds)` retornando `{allowed, remaining, retryAfter}`. Documentar tolerancia ±1 por consistencia eventual.
- [ ] **T3** Validador `resendVerifySchema` en `src/lib/validators/auth.ts` (objeto vacío estricto).
- [ ] **T4] Endpoint `src/pages/api/v1/auth/verify-email/resend.ts` (POST, sesión):
  - `requireSession` (middleware existente).
  - Lee `users.email_verified_at` → 409 si ya verificado.
  - Check rate limit 5min → 429 con `retry_after_seconds` si ≥1.
  - Check rate limit 24h → 429 si ≥5.
  - `invalidatePrevious` + `issueToken` + `runDeferred(ctx, send(...))`.
  - Incrementa ambos contadores con TTL respectivo.
  - Responde 202 con `next_allowed_at` (now + 5 min).
- [ ] **T5** Componente `src/components/auth/ResendVerifyButton.astro` con prop `{context: 'banner' | 'expired-card'}`. Isla mínima para manejar POST, loading, success, 429 con countdown.
- [ ] **T6** Integrar `ResendVerifyButton` en `src/pages/verify-email/[token].astro` (estado expired) y en `src/components/banners/EmailVerificationBanner.astro` (HU-20.4).
- [ ] **T7** La isla deshabilita el botón durante fetch y muestra countdown si llega 429.
- [ ] **T8** Tests:
  - [ ] `tests/unit/middleware/rate-limit-resend.test.ts` — contador 5 min y 24 h, expiración correcta.
  - [ ] `tests/unit/auth/email-verify-invalidate.test.ts` — borrado de token anterior antes de emitir nuevo.
  - [ ] `tests/integration/auth/verify-email-resend.test.ts` — 202 happy path, 429 segundo intento, 409 ya verificado, 401 sin sesión, 429 límite diario.
  - [ ] `tests/e2e/reenviar-verificacion.spec.ts` — usuario en dashboard → click "Reenviar" → ve confirmación → Mailpit recibe nuevo correo con token distinto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en el endpoint, no incrementar el counter de 24h → usuario puede reenviar ilimitadamente, test integración rojo al 6° intento → restaurar
- [ ] Sabotaje 2: olvidar `invalidatePrevious` antes de emitir nuevo → quedan dos tokens válidos para el mismo user, test integración con KV rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/middleware/rate-limit.ts`, `src/lib/services/auth/email-verify.ts` (rama invalidate+issue)
- [ ] Type check verde
- [ ] Commit `feat: reenviar email verificación con rate limit` y push