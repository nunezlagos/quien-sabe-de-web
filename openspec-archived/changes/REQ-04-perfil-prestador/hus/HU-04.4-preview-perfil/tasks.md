# HU-04.4 — Vista preview del perfil antes de publicar

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.4-preview-perfil`

## Tareas tecnicas

- [ ] **T1** Helper `canPublish(provider, verification)` en `src/lib/services/providers.ts` — valida descripción ≥ 20 chars, `photo_r2_key != null`, `trade_id` + `commune_id` presentes, verificación aprobada.
- [ ] **T2** Helper `authorizePreview(session, provider)` en `src/lib/services/preview.ts` — `session?.userId === provider.userId && provider.status === 'draft'`.
- [ ] **T3** Componente `src/components/profile/PreviewBadge.astro` — banner `bg-yellow-100 text-yellow-800` con icono `ri-eye-line` y texto "VISTA PREVIA". Sólo se monta cuando `Astro.url.searchParams.get('preview') === 'true'`.
- [ ] **T4** Componente `src/components/dashboard/provider/Preview.astro` — iframe wrapper con badge overlay, botón "Abrir en pestaña", botón "Publicar" (deshabilitado si `canPublish === false`).
- [ ] **T5** Modificar `src/pages/p/[slug].astro` para reconocer `?preview=true` → si pasa `authorizePreview`, render normal con `PreviewBadge` + `Cache-Control: no-store`. En cualquier otro caso → 404.
- [ ] **T6** Modificar endpoint `PATCH /api/v1/providers/me` (de HU-04.2) para invocar `canPublish` antes de aceptar `status='published'`. Si falla → 422 con `{ error, missing: [...] }`.
- [ ] **T7** Modificar `/dashboard-provider` para mostrar `<Preview />` sólo si `status='draft'` y `slug` existe.
- [ ] **T8** Tests:
  - [ ] `tests/integration/providers/preview.test.ts` — sesión propia + draft → 200; sesión ajena → 404; anónimo → 404; status='published' + sesión propia → 404.
  - [ ] `tests/integration/providers/publish.test.ts` — descripción corta → 422; sin foto → 422; sin verificación → 422; happy path → 200.
  - [ ] `tests/unit/services/can-publish.test.ts` — todas las combinaciones de precondiciones.
  - [ ] `tests/e2e/provider-preview.spec.ts` — prestador ve iframe, publica, perfil aparece en home.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar `authorizePreview` para que también acepte `status='published'` → `tests/integration/providers/preview.test.ts` (caso sesión propia + published) debe pasar a 200 y romper el test que espera 404 → restaurar.
- [ ] **S2** Quitar la validación de `canPublish` del handler PATCH → `tests/integration/providers/publish.test.ts` (caso descripción corta) debe pasar a 200 y romper el test que espera 422 → restaurar.
- [ ] **S3** Eliminar el `Cache-Control: no-store` del response `/p/<slug>?preview=true` → agregar aserción en test de integration que verifique el header → debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Tests Playwright `tests/e2e/provider-preview.spec.ts` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/preview.ts` y componente `PreviewBadge`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
