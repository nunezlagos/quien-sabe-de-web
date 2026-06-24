# HU-16.6 — Versionado legal y re-aceptación

**Estado:** planned → ready
**Prioridad:** P2
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.6-versionado-legal`

## Tareas tecnicas

- [ ] **T1** Migración `00XX_legal_reacceptance.sql` que agregue `accepted_terms_at` (INTEGER) y `accepted_terms_version` (TEXT) a `users`. Actualizar `src/database/schema.ts`. Aplicar con `db:migrate:local`.
- [ ] **T2** `acceptTermsBodySchema` en `src/lib/validators/legal.ts` con Zod `{ version: regex /^v\d+$/ }`. Tests unitarios cubren válidos e inválidos.
- [ ] **T3** Servicio `getCurrentLegalVersion(db, slug)` en `src/lib/services/legal-versions.ts` que retorna la versión más reciente de `legal_versions` por `published_at DESC LIMIT 1`. Test integración cubre 0, 1 y N filas.
- [ ] **T4** Servicio `recordTermsAcceptance(db, userId, version)` en `src/lib/services/users.ts` que hace `UPDATE users SET accepted_terms_version = ?, accepted_terms_at = ? WHERE id = ?`. Retorna `{ acceptedAt: Date }`. Test integración cubre happy path y user inexistente.
- [ ] **T5** Helper `compareVersions(a, b)` simple (string compare sobre `"vN"`) en `src/lib/utils/version.ts` (suficiente para `v1 < v2`).
- [ ] **T6** `src/lib/middleware/legal-acceptance.ts` con `enforceLegalAcceptance` middleware. Si `Astro.locals.user` undefined → next. Si path empieza con `/api/` o es `/terms` o `/logout` → next. Si `user.acceptedTermsVersion !== currentVersion` → redirect 302 a `/terms?reaccept=true&return=<path>`.
- [ ] **T7** Agregar `enforceLegalAcceptance` al `sequence()` en `src/middleware.ts` (último en la cadena).
- [ ] **T8** Endpoint `src/pages/api/v1/users/me/accept-terms.ts` con Zod, lectura de sesión vía `Astro.locals.user`, llamada a `recordTermsAcceptance`, response 200. Si falla Zod → 400 con detalle. Si no hay sesión → 401.
- [ ] **T9** Extender `src/pages/terms.astro` (de HU-16.3) para que cuando `Astro.url.searchParams.get('reaccept') === 'true'`, muestre banner amarillo arriba con form POST a `/api/v1/users/me/accept-terms` (input hidden `version`, hidden `return_to`).
- [ ] **T10** Tests:
  - [ ] `tests/unit/validators/legal.test.ts` (extender) — `acceptTermsBodySchema` casos.
  - [ ] `tests/unit/utils/version.test.ts` — `compareVersions("v1","v2")` retorna -1; iguales retorna 0; v10 > v9.
  - [ ] `tests/integration/legal/reaccept.test.ts` — `getCurrentLegalVersion` con 0/1/N filas; `recordTermsAcceptance` update real.
  - [ ] `tests/integration/middleware/legal-acceptance.test.ts` — anónimo pasa; autenticado con version vigente pasa; autenticado desactualizado recibe 302; POST a `/api/...` no es interceptado.
  - [ ] `tests/e2e/legal-reaccept.spec.ts` — login → dashboard con version vieja → redirect → POST accept → dashboard 200.
- [ ] **T11** Verificar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para idempotencia en re-migración; documentar en el SQL.

## Sabotajes a confirmar

1. En `legal-acceptance.ts`, cambiar la condición de skip de `/api/` por `!Astro.url.pathname.startsWith('/dashboard')` → el POST a `/api/v1/users/me/accept-terms` queda interceptado, no llega al endpoint, test integración de middleware rojo → restaurar.
2. En `getCurrentLegalVersion`, quitar `LIMIT 1` y `orderBy` → test que aserta "última por fecha" con 3 versiones falla → restaurar.
3. Cambiar `compareVersions` para que retorne siempre `0` (igualdad) → middleware nunca redirige, test E2E que espera redirect con version desactualizada falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/legal.test.ts tests/unit/utils/version.test.ts tests/integration/legal/reaccept.test.ts tests/integration/middleware/legal-acceptance.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/legal-reaccept.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: skip incorrecto → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin `LIMIT/ORDER BY` → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: compare roto → test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/middleware/legal-acceptance.ts`, `src/lib/services/legal-versions.ts`, `src/lib/services/users.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: versionado legal + endpoint re-aceptación` y push a rama (no merge a main)
