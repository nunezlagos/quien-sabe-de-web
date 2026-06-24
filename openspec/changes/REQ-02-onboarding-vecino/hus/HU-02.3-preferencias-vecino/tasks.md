# HU-02.3 — Preferencias de notificación e intereses

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-02-onboarding-vecino
**Rama:** `feat/HU-02.3-preferencias-vecino`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `userPreferences` a `src/database/schema.ts` con PK en `userId`, FK a `users` con ON DELETE CASCADE, columnas `notifyEmail`, `interests JSON`, `updatedAt`.
- [ ] **T2** Migración `src/database/migrations/0005_user_preferences.sql` con `CHECK (json_array_length(interests) <= 50)`.
- [ ] **T3** Constante `ALLOWED_INTERESTS` en `src/lib/constants/interests.ts` (whitelist sincronizada con mockup `mockups/create-trade.html` cuando exista; inicialmente hardcoded).
- [ ] **T4** Zod schema `PreferencesPatch` en `src/lib/validators/preferences.ts`.
- [ ] **T5** Extender `OnboardingPatch` en `src/lib/validators/onboarding.ts` con campo opcional `preferences: PreferencesPatch`.
- [ ] **T6** Servicio `src/lib/services/preferences.ts` con `upsertPreferences(db, userId, patch)` (merge parcial) y `getPreferences(db, userId)`.
- [ ] **T7** Extender handler `PATCH` de `src/pages/api/v1/users/me/profile.ts` (de HU-02.2) para llamar `upsertPreferences` cuando `body.preferences` presente.
- [ ] **T8** Componente `src/components/onboarding/PreferencesStep.astro` con checkboxes de intereses (de `ALLOWED_INTERESTS`) + toggle notify_email.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/preferences.test.ts` — acepta `notify_email: false`; rechaza `interests: ['oficio-inexistente']` con mensaje; rechaza array > 50.
  - [ ] `tests/unit/preferences/merge.test.ts` — `upsertPreferences` con sólo `notify_email` modifica ese campo y conserva `interests` previo; con sólo `interests` modifica array y conserva `notify_email` previo.
  - [ ] `tests/integration/onboarding/preferences.test.ts` — PATCH inicial crea fila en `user_preferences`; PATCH parcial conserva campos no enviados; `interests: ['oficio-inexistente']` → 422 con detalle del slug inválido.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: quitar el `.refine` de la whitelist en `PreferencesPatch.interests` → test "Interés con slug inválido → 422" debe detectar que se acepta un slug basura → restaurar.
- [ ] **Sabotaje 2**: en `upsertPreferences`, reemplazar el array completo SIN leer el previo cuando `interests` viene en el patch (merge destructivo en vez de union) → test "PATCH parcial conserva campos no enviados" debe detectar que se pierden intereses previos al actualizar `notify_email` (caso opuesto al esperado, así que ajustamos el test: si el usuario envía sólo `notify_email`, `interests` debe quedar intacto; si lo rompemos a "siempre reemplazar con array vacío", el test cae) → restaurar.
- [ ] **Sabotaje 3**: cambiar `notifyEmail` default `true` por `false` en el schema → test "Guardar preferencias por primera vez" debe detectar que el default no coincide con el esperado cuando no se envía el campo → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/preferences.ts` y `src/lib/validators/preferences.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-02.3-preferencias-vecino` (no merge a main sin review)
