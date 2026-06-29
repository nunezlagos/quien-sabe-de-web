# HU-19.3 — Confirmar nuevo password usando token

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-19-recuperacion-password
**Rama:** `feat/HU-19.3-form-nuevo-password`

## Tareas tecnicas

- [ ] **T0** Verificar que `users.password_hash` (text, nullable o no) existe en `src/database/schema.ts`. Si no, agregarla en una migración `00XX_users_password_hash.sql` y aplicar antes de T1.
- [ ] **T1** Instalar `@node-rs/argon2` y verificar compatibilidad con Workers (build local + miniflare).
- [ ] **T2** `src/lib/services/auth/hash.ts` con `hashPassword(plain)` y `verifyPassword(plain, hash)`. Tests unitarios round-trip + verify con texto incorrecto.
- [ ] **T3** `newPasswordSchema` y `resetBodySchema` en `src/lib/validators/auth.ts`. Tests cubren: min 10, mayúscula, minúscula, número, símbolo; rechazo de "1234" con 4 detalles.
- [ ] **T4** `consumeResetToken({ kv, db, emailService }, { token, newPassword })` en `src/lib/services/auth/reset-token.ts` (ampliar). Orquesta: `kv.get` → 410 si null; `verifyPassword` contra hash actual → 422 si match; hash + UPDATE; `kv.delete`; `revokeAllSessions` (HU-19.4). Si revoke falla → restaurar hash previo.
- [ ] **T5** Endpoint `src/pages/api/v1/auth/reset.ts` con POST, valida Zod, llama `consumeResetToken`, mapea errores a status (410/422/200).
- [ ] **T6** Componente `src/components/auth/PasswordStrengthMeter.astro` con `<script>` que escucha input, calcula score, aplica clase de color a una barra. Test unitario del score (no requiere DOM, función pura `computePasswordScore`).
- [ ] **T7** `src/pages/reset/[token].astro` (extender HU-19.2): cuando `valid`, renderiza form con `<PasswordStrengthMeter>`, input confirmación, lista de requisitos, botón submit. Script cliente hace `fetch` y maneja 200/410/422.
- [ ] **T8** Helper `computePasswordScore(plain): number` en `src/lib/utils/password-score.ts` puro (sin DOM) para testear.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/auth.test.ts` (extender) — `newPasswordSchema` casos.
  - [ ] `tests/unit/auth/hash.test.ts` — round-trip + verify fail.
  - [ ] `tests/unit/utils/password-score.test.ts` — `"1234"` → 0; `"S3gur@Pass"` → ≥ 4; `"S3gur@Pass!Plus"` → 5.
  - [ ] `tests/unit/components/password-strength.test.ts` — script de render presente, referenciando `#strength-bar` y `#strength-text`.
  - [ ] `tests/integration/auth/reset-confirm.test.ts` — happy path: 200 + UPDATE + KV delete; weak → 422 con `details`; reused → 422; token null → 410; rollback si revoke lanza.
  - [ ] `tests/e2e/reset-flow.spec.ts` — `goto('/forgot-password')` → submit → click link en Mailpit (HTML extraído del body) → form de reset visible → tipear password fuerte → submit → redirect a `/login?reset=ok`.
- [ ] **T10] Verificar manualmente: ciclo completo con Mailpit, confirmar que la key KV se elimina, el password cambia (login con viejo falla, con nuevo funciona).

## Sabotajes a confirmar

1. En `newPasswordSchema`, quitar el `.regex(/[^A-Za-z0-9]/)` (símbolo) → test que valida `"S3gurPasss1"` espera fallo por símbolo y recibe éxito → restaurar.
2. En `consumeResetToken`, eliminar la llamada a `kv.delete(token)` → el token queda vivo; segundo POST con mismo token + nuevo password pasa el `kv.get` y completa el flujo; test que verifica "token de un solo uso" (segundo POST retorna 410) falla → restaurar.
3. En el endpoint, no hacer el rollback del hash si `revokeAllSessions` lanza → test que verifica "rollback si revoke falla" recibe estado inconsistente (hash nuevo + sesiones viejas) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/auth.test.ts tests/unit/auth/hash.test.ts tests/unit/utils/password-score.test.ts tests/integration/auth/reset-confirm.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/reset-flow.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: regex omitido → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: `kv.delete` omitido → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: sin rollback → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/{hash,reset-token}.ts` y `src/lib/utils/password-score.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: confirm password reset con argon2id` y push a rama (no merge a main)
