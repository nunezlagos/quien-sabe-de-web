# HU-13.6 — Settings globales editables

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-13-dashboard-admin
**Rama:** `feat/HU-13.6-settings-globales`

## Tareas tecnicas

- [ ] **T1** Migración `src/database/migrations/00XX_settings.sql` con tabla `settings`.
- [ ] **T2** Actualizar `src/database/schema.ts#settings`.
- [ ] **T3** Seed inicial en la misma migración: INSERT de las 5 keys conocidas con defaults de la registry.
- [ ] **T4** `SETTINGS_REGISTRY` en `src/lib/services/settings/registry.ts` con 5 entries y sus Zod schemas.
- [ ] **T5** Generador `settingsPatchSchema` desde la registry (Zod object dinámico).
- [ ] **T6** Servicio `getSettings(env)` con cache KV `settings:current` TTL 3600s.
- [ ] **T7** Servicio `patchSettings(env, actorId, patch)` con validación Zod + UPDATE + invalidación cache + audit log por key.
- [ ] **T8** Side effect: si key cambiada es `kpis_cache_ttl_seconds`, invocar `invalidateKpisCache(env)`.
- [ ] **T9** Endpoint `src/pages/api/v1/admin/settings.ts` (`GET`, `PATCH`).
- [ ] **T10** Componente `SettingField.astro` con label + descripción + input tipado.
- [ ] **T11** Componente `SettingsPanel.astro` con lista de fields + "Guardar todo".
- [ ] **T12** Cablear `SettingsPanel` en `settings-section` de `dashboard-admin.astro`.
- [ ] **T13** Tests:
  - [ ] `tests/unit/admin-settings/registry.test.ts` — 5 keys con defaults y schemas.
  - [ ] `tests/unit/admin-settings/patch-schema.test.ts` — body vacío rechaza; rate_limit_contact=-1 rechaza con path específico.
  - [ ] `tests/integration/admin/settings-get.test.ts` — tabla vacía devuelve defaults; segunda llamada cache HIT.
  - [ ] `tests/integration/admin/settings-patch.test.ts` — PATCH OK + cache invalidado + audit log + kpis cache invalidado cuando aplica.
  - [ ] `tests/integration/admin/settings-rbac.test.ts` — vecino 403; sin sesión 401.
  - [ ] `tests/integration/admin/settings-validation.test.ts` — 422 con details Zod.
  - [ ] `tests/e2e/admin-settings.spec.ts` — admin cambia setting; siguiente GET refleja cambio.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/admin-settings.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: quitar `env.KV.delete('settings:current')` en patchSettings → test "cache invalidado" cae en rojo → restaurar
  - [ ] Sabotaje 2: invertir la condición `if (key === 'kpis_cache_ttl_seconds')` por `!==` → test "kpis cache invalidado cuando aplica" cae en rojo → restaurar
  - [ ] Sabotaje 3: comentar `logAdminAction` por key cambiada → test "audit log por key" cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/admin/settings.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
