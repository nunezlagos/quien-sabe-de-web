# HU-19.1 — Solicitar reset de contraseña por email

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-19-recuperacion-password
**Rama:** `feat/HU-19.1-form-solicitar-reset`

## Tareas tecnicas

- [ ] **T1** Helper `generateResetToken()` en `src/lib/services/auth/reset-token.ts` que usa `crypto.getRandomValues(new Uint8Array(32))` y retorna hex lowercase de 64 chars. Tests verifican longitud, charset y unicidad en 1000 ejecuciones.
- [ ] **T2** Validador `forgotPasswordSchema` en `src/lib/validators/auth.ts` con Zod `{ email: z.string().email().max(254) }`.
- [ ] **T3** Rate limiter `checkRateLimit(kv, key, limit, windowSec)` en `src/lib/middleware/rate-limit.ts` con clave configurable. Implementación: `kv.get(key)` (contador) + `kv.put(key, n+1, { expirationTtl: windowSec })`. Retorna `{ allowed, remaining }`.
- [ ] **T4** Servicio `requestPasswordReset({ db, kv, emailService, ip }, { email })` en `src/lib/services/auth/forgot-password.ts`:
  1. `checkRateLimit` con `key: 'rl:fp:email:'+hash(email)`, limit 3, window 3600.
  2. `checkRateLimit` con `key: 'rl:fp:ip:'+ip`, limit 5, window 3600.
  3. Si user existe: `generateResetToken()`; `kv.put('pwreset:<token>', { user_id }, { expirationTtl: 1800 })`; `emailService.send({ template:'password_reset', to, vars: { resetUrl, expiresInMinutes: 30 }, relatedEntity: 'user:'+user_id })`.
  4. Si no existe: skip silencioso.
  5. Retorna siempre sin lanzar.
- [ ] **T5** Endpoint `src/pages/api/v1/auth/forgot-password.ts` con POST, valida Zod, lee IP de `cf-connecting-ip` o `x-forwarded-for` (fallback), llama al servicio, retorna 202 (o 429 si rate limit excede; 400 si Zod falla).
- [ ] **T6** Template `password_reset.html.ts` y `password_reset.txt.ts` en `src/lib/services/email/templates/` con vars `{ name, resetUrl, expiresInMinutes }`. Registrar en `index.ts`. Si el template no existe, el render usa un fallback genérico (warning + body mínimo con resetUrl) — decisión: NO, mejor bloquear hasta que exista (HU coordina).
- [ ] **T7** `src/pages/forgot-password.astro` con `BaseLayout` + componente `ForgotPasswordForm.astro` que replica `mockups/forgot-password.html:28-68` (card blanca, ícono `ri-lock-unlock-line`, success card oculta inicialmente).
- [ ] **T8** Componente `src/components/auth/ForgotPasswordForm.astro` con `<script>` que al submit hace `fetch` POST y toggle entre form y `#success-card`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/auth/reset-token.test.ts` — longitud 64, hex puro, 1000 tokens distintos.
  - [ ] `tests/unit/validators/auth.test.ts` — Zod casos.
  - [ ] `tests/unit/middleware/rate-limit.test.ts` — KV mock: 3 hits OK, 4to 429, reset tras TTL.
  - [ ] `tests/integration/auth/forgot-password.test.ts` — email existe → KV put + email send + log row; email no existe → 202 sin storage; 4ta request email → 429; 6ta request IP → 429.
  - [ ] `tests/e2e/forgot-password.spec.ts` — `page.goto('/forgot-password')` → submit email → ve success card.
- [ ] **T10** Verificar manualmente: registrar un user, abrir `/forgot-password`, submit, revisar Mailpit; inspeccionar KV local con `bunx wrangler kv:key list --binding SESSION` (debe mostrar `pwreset:...`).

## Sabotajes a confirmar

1. En `requestPasswordReset`, invertir el orden: si user NO existe, también generar token y guardarlo en KV (KV inflado) → test que verifica "email no existe → 0 keys en KV" falla → restaurar.
2. En `checkRateLimit`, retornar siempre `{ allowed: true }` → 4ta request no recibe 429, test de rate limit por email falla → restaurar.
3. En `generateResetToken`, usar `Math.random()` (no CSPRNG) → test que genera 1000 tokens espera todos distintos y obtiene colisiones; test de longitud 64 sigue pasando pero el de unicidad falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/auth tests/unit/validators tests/unit/middleware tests/integration/auth/forgot-password.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/forgot-password.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: orden invertido → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: rate limit deshabilitado → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: `Math.random` → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/{reset-token,forgot-password}.ts` y `src/lib/middleware/rate-limit.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: forgot-password endpoint + form + rate limit` y push a rama (no merge a main)
