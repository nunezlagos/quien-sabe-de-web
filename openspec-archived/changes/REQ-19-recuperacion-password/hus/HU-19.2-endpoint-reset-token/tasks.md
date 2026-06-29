# HU-19.2 — Validar token de reset vigente

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-19-recuperacion-password
**Rama:** `feat/HU-19.2-endpoint-reset-token`

## Tareas tecnicas

- [ ] **T1** `maskEmail(email)` en `src/lib/utils/mask.ts` con la lógica: primeros 2 chars + `***@domain`; si local < 2 chars, primer char + `***@domain`; throw si no hay `@`. Tests cubren casos normales, cortos y sin `@`.
- [ ] **T2** `getResetTokenStatus(kv, token)` en `src/lib/services/auth/reset-token.ts` (ampliar el archivo de HU-19.1). Lee `kv.get<{user_id, created_at}>('pwreset:'+token, 'json')`; retorna `{ valid:true, userId, createdAt }` o `{ valid:false, reason }`. Verifica también `Date.now() - created_at <= 1800_000` como defensa.
- [ ] **T3** Endpoint `src/pages/api/v1/auth/reset/[token].ts` con GET. Valida regex `/^[a-f0-9]{64}$/`; si no matchea → 410. Llama `getResetTokenStatus`; si válido, hace `db.select({email: users.email}).from(users).where(eq(users.id, userId))` y aplica `maskEmail`. Response 200 o 410.
- [ ] **T4** `src/pages/reset/[token].astro` con `export const prerender = false`. Frontmatter: valida regex del token (si no, redirect a `/forgot-password`); llama `getResetTokenStatus(kv, token)`; si no válido, render card de error; si válido, deja slot default para HU-19.3 (placeholder por ahora).
- [ ] **T5** Card de error en `src/pages/reset/[token].astro` (cuando `!valid`): centrado, ícono `ri-error-warning-line` rojo, título "Este enlace expiró", texto gris, botón `bg-primary rounded-xl` que linkea a `/forgot-password`. Patrón visual de `mockups/profile.html` secciones de error.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/mask.test.ts` — `maskEmail("vecino@example.com")` → `"ve***@example.com"`; `"a@b.cl"` → `"a***@b.cl"`; `"ab@x"` → `"ab***@x"`; `"invalid"` lanza.
  - [ ] `tests/unit/auth/reset-token-status.test.ts` — KV mock: null → not_found; created_at viejo → expired; reciente → valid.
  - [ ] `tests/integration/auth/reset-token-validate.test.ts` — endpoint: token válido sembrado en KV + user sembrado en DB → 200 con `user_email_masked` correcto; token inexistente → 410; token con formato inválido → 410; token con `created_at` viejo → 410.
  - [ ] `tests/e2e/reset-token-page.spec.ts` — `page.goto('/reset/<vigente>')` ve form (placeholder HU-19.3); `page.goto('/reset/<invalido>')` ve card de error con link a `/forgot-password`.
- [ ] **T7** Verificar manualmente con Mailpit: clic en el link de un email de reset real → llega a `/reset/<token>` con form; manipular el token en la URL → card de error.

## Sabotajes a confirmar

1. En `getResetTokenStatus`, invertir las comparaciones: retornar `{valid:true}` cuando NO encuentra la key → el endpoint devuelve 200 para tokens inexistentes; test integración que espera 410 recibe 200 → restaurar.
2. En `maskEmail`, retornar el email completo sin enmascarar → test unitario que verifica `"ve***@..."` recibe el email crudo → restaurar.
3. En el endpoint, no validar la regex del path param → un request a `/api/v1/auth/reset/abc` (corto) entra al flujo KV; el path param no se valida hasta el final, el test que espera 410 inmediato falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/utils/mask.test.ts tests/unit/auth/reset-token-status.test.ts tests/integration/auth/reset-token-validate.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/reset-token-page.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: comparación invertida → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin enmascarar → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: regex omitida → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/reset-token.ts` y `src/lib/utils/mask.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: validate reset token + endpoint + mask util` y push a rama (no merge a main)
