# HU-21.5 — Banner verificación pendiente en dashboard prestador

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-21-onboarding-prestador
**Rama:** `feat/HU-21.5-estado-pending-en-dashboard`

## Tareas técnicas

- [ ] **T1** Crear `src/components/banners/ProviderStatusBanner.astro` con props `{ status, rejectionReason? }`. Lógica: `approved` → retorna `null`; `pending_verification` → banner amarillo `bg-yellow-50 border-yellow-200` con icono `ri-time-line`, texto "Tu perfil está en revisión", CTA "Ir a verificación" → `/verification`; `rejected` → banner rojo `bg-red-50 border-red-200` con icono `ri-error-warning-line`, texto del motivo (fallback genérico), CTA "Reintentar" → `/verification`.
- [ ] **T2** Insertar `<ProviderStatusBanner>` en `src/pages/dashboard-provider.astro` (REQ-12) arriba del card "Editar Perfil" (`mockups/dashboard-provider.html:125`), sólo si `provider` existe. Pasar `status={provider.status}` y `rejectionReason={provider.rejectionReason}`.
- [ ] **T3** Verificar que `getProviderByUserId` (REQ-12) retorna `rejectionReason` o agregar la columna al SELECT si no la trae. Si la columna no existe aún en DB, dejarla como `undefined` y usar fallback en el componente.
- [ ] **T4** Tests:
  - [ ] `tests/unit/components/provider-status-banner.test.ts` — snapshot del HTML renderizado para pending y rejected; verifica que `status="approved"` produce string vacío.
  - [ ] `tests/integration/dashboard/provider-banner.test.ts` — SSR con fixture `status=pending_verification` y `user_id` válido: HTML contiene `<div class="bg-yellow-50 ...` y CTA `href="/verification"`. Fixture `status=approved`: HTML NO contiene el banner. Fixture `status=rejected` con `rejectionReason="Documento ilegible"`: HTML contiene el motivo.
  - [ ] `tests/e2e/dashboard-provider-status.spec.ts` (Playwright) — login prestador pending ve banner amarillo; login prestador approved NO ve banner; login prestador rejected ve banner rojo con texto del motivo y CTA.
  - [ ] Sabotaje 1: en `dashboard-provider.astro`, hardcodear `<ProviderStatusBanner status="approved" />` → E2E con fixture pending verifica que el banner SIGUE visible (test rojo) → restaurar.
  - [ ] Sabotaje 2: en el componente, eliminar la rama `status === 'approved'` que retorna null → E2E con fixture approved detecta banner visible (test rojo) → restaurar.
  - [ ] Sabotaje 3: en el componente rejected, no usar el `rejectionReason` prop y siempre mostrar el fallback genérico → test integración con `reason="Documento ilegible"` verifica que el texto específico aparece (test rojo) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (incluye las 3 variantes)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/components/banners/ProviderStatusBanner.astro`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: banner verificación pendiente en dashboard prestador` y push a rama (no merge a main)