# HU-12.3 — Sección de edición de perfil inline

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.3-seccion-perfil-edicion`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/provider-profile.service.ts` con `patchProvider`, `triggerReindexIfTradeChanged`, `replaceSchedule` (firmas en `design.md`). `triggerReindexIfTradeChanged` delega en REQ-04.5 (placeholder hasta que exista).
- [ ] **T2** Validador `patchProviderSchema` y `scheduleSchema` en `src/lib/validators/provider-profile.ts` (reuso de REQ-04).
- [ ] **T3** Componente `src/components/dashboard/provider/ProfileSection.astro` con prop `provider`. Mockup `mockups/dashboard-provider.html:97-195`. Isla `client:visible`.
- [ ] **T4** Componente `src/components/dashboard/provider/AvatarUploader.astro` con props `{currentAvatarUrl?, initials}`. Mockup `mockups/dashboard-provider.html:101-110`. Isla con input file + preview.
- [ ] **T5** Componente `src/components/dashboard/provider/GalleryEditor.astro` con props `{images, max=5}`. Mockup `mockups/dashboard-provider.html:152-186`. Isla con upload + delete. Bloquea `max` con mensaje claro.
- [ ] **T6** Componente `src/components/dashboard/provider/ScheduleEditor.astro` con prop `schedule`. Mockup `mockups/dashboard-provider.html:228-352`. Isla con toggles + time pickers.
- [ ] **T7** Integrar `ProfileSection` en `dashboard-provider.astro` bajo anchor `#perfil`. Pasar el provider resuelto por SSR.
- [ ] **T8** Cablear handlers de submit a los endpoints existentes de REQ-04 (PATCH, avatar POST, gallery POST/DELETE, schedule PUT). Mapear respuestas 200/201 a toasts; errores 400/409 a mensajes inline en el campo.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/provider-profile.test.ts` — rechaza `hourly_rate_clp` negativo, `bio` > 2000, schedule con `from > to`.
  - [ ] `tests/unit/services/provider-profile.test.ts` — `triggerReindexIfTradeChanged` se llama sólo cuando cambia el oficio.
  - [ ] `tests/integration/providers/patch-provider.test.ts` — PATCH persiste, cambio de oficio dispara reindex (mock), prestador no puede editar a otro.
  - [ ] `tests/e2e/provider-edit-profile.spec.ts` — edita biografía → guarda → recarga → muestra cambio; edita oficio → toast "indexando...".

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: cambiar la validación Zod `hourly_rate_clp` para aceptar negativo → test unitario rojo → restaurar
- [ ] Sabotaje 2: en `triggerReindexIfTradeChanged` no comparar `before !== after` → reindex se llama siempre (incluso si no cambió), test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/provider-profile.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: sección edición de perfil en dashboard` y push