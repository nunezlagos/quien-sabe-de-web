# HU-21.4 — Redirect post-wizard a /verification

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-21-onboarding-prestador
**Rama:** `feat/HU-21.4-redirect-a-verificacion`

## Tareas técnicas

- [ ] **T1** Crear `src/lib/client/onboarding.ts` con función `submitProviderWizard(form: HTMLFormElement): Promise<void>`:
  - `event.preventDefault()`.
  - Construir payload: `displayName`, `tradeId` (null si value === "otro"), `tradePendingApproval` (string si "otro"), `bio`, `whatsapp` (raw), `basePriceClp` (number), `communeIds` (array desde `formData.getAll('communeIds[]')` parseados a number).
  - Validación cliente: si `communeIds.length === 0` → mostrar mensaje inline y abortar.
  - `submitButton.disabled = true`; texto "Enviando...".
  - `fetch('/api/v1/providers/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.
  - Si 201 → `window.location.assign('/verification')`.
  - Si 422 → renderizar `<span class="text-red-500 text-xs mt-1">` bajo el campo problemático; restaurar botón.
  - Si 5xx o red caída → mostrar toast rojo `bottom-6 right-6` con `role="alert"`; auto-dismiss 5s.
- [ ] **T2** Crear contenedor de toast en `src/components/feedback/Toast.astro` (props `{kind, message}` reusables). Insertar markup base en `src/layouts/Layout.astro`.
- [ ] **T3** En `src/pages/create-trade.astro`, agregar bloque `<script>` al final:
  ```astro
  <script>
    import { submitProviderWizard } from '@/lib/client/onboarding';
    document.getElementById('provider-wizard-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitProviderWizard(e.target as HTMLFormElement);
    });
  </script>
  ```
- [ ] **T4** Validar que el `<form>` en `ProviderWizard.astro` tiene `id="provider-wizard-form"`. Si no, ajustar en HU-21.1.
- [ ] **T5] Tests:
  - [ ] `tests/unit/client/onboarding.test.ts` (con jsdom) — mock `fetch`: 201 → llama `window.location.assign('/verification')`; 422 con `{error, field}` → agrega `<span class="text-red-500 ...">` con el mensaje; 500 → muestra toast `#toast` visible; red caída (fetch rejects) → toast genérico; communeIds vacío → no llama fetch, muestra mensaje.
  - [ ] `tests/e2e/create-trade-flow.spec.ts` — Playwright con `route.fulfill` mockeando 201: login → completa form (mock catálogo) → submit → URL final = `/verification`.
  - [ ] `tests/e2e/create-trade-error.spec.ts` — mock 500: submit → permanece en `/create-trade` + toast `#toast` visible; doble click submit → `fetch` llamado 1 sola vez (button disabled persiste).
  - [ ] Sabotaje 1: en `submitProviderWizard`, comentar `window.location.assign('/verification')` → E2E verifica URL final es `/create-trade` (test rojo) → restaurar.
  - [ ] Sabotaje 2: eliminar el `submitButton.disabled = true` → E2E doble-click dispara 2 fetches (test verifica que solo se llamó 1 vez) → restaurar.
  - [ ] Sabotaje 3: en el handler de 5xx, no mostrar toast → E2E con mock 500 verifica toast visible → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (incluye los 3 escenarios)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/client/onboarding.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: redirect post-wizard a verification` y push a rama (no merge a main)