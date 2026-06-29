# HU-11.4 — Modal de edición de perfil del vecino

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-11-dashboard-vecino
**Rama:** `feat/HU-11.4-editar-perfil-modal`

## Tareas tecnicas

- [ ] **T1** Validator `editProfileSchema` en `src/lib/validators/edit-profile-modal.ts` (espejo del server schema de REQ-02 + `emailSchema` para validación inline).
- [ ] **T2** Componente `EditProfileButton.astro` con `id="edit-profile-btn"` y `ri-edit-line`. Sólo se renderiza si `Astro.locals.user` no es null.
- [ ] **T3** Componente `EditProfileModal.astro` con backdrop `bg-black/50`, card `bg-white rounded-3xl max-w-md`, header gris con título "Editar Mis Datos" + botón cerrar.
- [ ] **T4** Form dentro del modal: select `commune_id` (poblado con `communes` desde el padre), checkbox `notify_email`, chips `interests` (3-6 categorías hardcoded si no hay componente previo).
- [ ] **T5** Script del modal: toggle show/hide, ESC cierra, click en backdrop cierra, foco al primer input al abrir, deshabilitar botón "Guardar" durante fetch.
- [ ] **T6** Cliente fetch: `PATCH /api/v1/users/me/profile` con payload `editProfileSchema`. Mapeo de errores Zod (`error.issues`) a mensajes inline por campo.
- [ ] **T7** Integrar `EditProfileButton` y `EditProfileModal` en `src/components/dashboard/user/Layout.astro` (header + slot profile).
- [ ] **T8** Cargar `communes` en `dashboard-user.astro` (vía `listCommunes(env)` de REQ-02) y pasarlas como prop al modal.
- [ ] **T9** Tests:
  - [ ] `tests/unit/edit-profile-modal/validate.test.ts` — email malformado, commune_id negativo, interests > 10.
  - [ ] `tests/integration/edit-profile-modal/patch.test.ts` — vecino válido PATCH 200; commune_id inexistente 422; sin sesión 401.
  - [ ] `tests/e2e/edit-profile-vecino.spec.ts` — abrir modal muestra valores; email inválido bloquea submit; guardar recarga con valores nuevos.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/edit-profile-vecino.spec.ts` → verde
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: quitar la validación `emailSchema` del cliente → test E2E "email inválido bloquea submit" cae en rojo → restaurar (porque la validación en server sigue, pero el test verifica el bloqueo temprano)
  - [ ] Sabotaje 2: comentar la línea que cierra el modal tras 200 → test E2E "modal se cierra tras guardar" cae en rojo → restaurar
  - [ ] Sabotaje 3: quitar el `disabled` del botón durante fetch → test E2E "doble submit bloqueado" (manual, lo agregamos al spec) cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/validators/edit-profile-modal.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
