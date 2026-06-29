# HU-02.2 — Wizard de onboarding con Zod

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-02-onboarding-vecino
**Rama:** `feat/HU-02.2-form-onboarding`

## Tareas tecnicas

- [ ] **T1** Agregar columnas de onboarding a `src/database/schema.ts` (`communeId`, `onboardedAt`, `acceptedTermsAt`, `acceptedPrivacyAt`, `termsVersion`, `privacyVersion`) e índice sobre `communeId`.
- [ ] **T2** Migración `src/database/migrations/0004_onboarding_fields.sql` con `ALTER TABLE` + `CREATE INDEX`.
- [ ] **T3** Constantes `CURRENT_TERMS_VERSION = 'v1'` y `CURRENT_PRIVACY_VERSION = 'v1'` en `src/lib/utils/terms.ts`.
- [ ] **T4** Zod schemas `OnboardingBody` y `OnboardingPatch` en `src/lib/validators/onboarding.ts` con `z.literal(true)` para consentimientos y `z.literal(CURRENT_*)` para versiones. Helper `assertCommuneExists(db, id)` para el refine.
- [ ] **T5** Servicio `src/lib/services/onboarding.ts` con `completeOnboarding`, `patchOnboarding`, `getOnboardingState` (upsert idempotente; `onboarded_at` se setea sólo en el primer POST).
- [ ] **T6** Endpoint `src/pages/api/v1/users/me/profile.ts` con handlers `GET`/`POST`/`PATCH`.
- [ ] **T7** Componente `src/components/onboarding/Wizard.astro` con 3 steps (commune, preferences placeholder, consents).
- [ ] **T8** Vista `src/pages/onboarding.astro` que monta el wizard y maneja redirect post-success a `/dashboard-user`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/onboarding.test.ts` — `OnboardingBody` rechaza `accepted_terms: false`, `terms_version: 'v0'`, `commune_id` inexistente.
  - [ ] `tests/unit/onboarding/state.test.ts` — primer POST setea `onboarded_at`; segundo POST con `commune_id` distinto actualiza comuna pero NO cambia `onboarded_at`.
  - [ ] `tests/integration/onboarding/post.test.ts` — POST válido 200 + fila en `users` con campos poblados; sin `accepted_terms: true` → 400 `debe aceptar términos`; `commune_id` inexistente → 422 `comuna inválida`.
  - [ ] `tests/integration/onboarding/patch.test.ts` — PATCH parcial actualiza sólo el campo enviado, conserva el resto.
  - [ ] `tests/e2e/onboarding-flow.spec.ts` — registro → middleware redirige a `/onboarding` → completar 3 pasos → redirect a `/dashboard-user`.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: cambiar `z.literal(true)` por `z.boolean()` en `accepted_terms` → test "POST sin accepted_terms: true → 400" debe pasar (pero test "debe aceptar términos" cae) → restaurar.
- [ ] **Sabotaje 2**: en `completeOnboarding`, hacer `UPDATE users SET onboarded_at = unixepoch()` SIEMPRE (sobrescribir el previo) → test "Re-envío del onboarding actualiza sin duplicar" debe detectar que `onboarded_at` cambió → restaurar.
- [ ] **Sabotaje 3**: eliminar la FK de `commune_id` o comentar el `assertCommuneExists` → test "Comuna inexistente → 422" debe detectar que se acepta un commune_id inválido → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/pages/api/v1/users/me/profile.ts` y `src/lib/services/onboarding.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-02.2-form-onboarding` (no merge a main sin review)
