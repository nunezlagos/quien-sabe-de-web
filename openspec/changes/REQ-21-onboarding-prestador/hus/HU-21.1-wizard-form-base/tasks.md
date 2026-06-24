# HU-21.1 — Port del wizard create-trade desde mockup

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-21-onboarding-prestador
**Rama:** `feat/HU-21.1-wizard-form-base`

## Tareas técnicas

- [ ] **T1** Crear vista `src/pages/create-trade.astro` con layout `src/layouts/Layout.astro`, fondo `bg-bg-light`, container `max-w-2xl mx-auto px-4 py-8`. SSR valida sesión (`Astro.locals.session`); sin sesión → `Astro.redirect('/login?next=/create-trade')`. Si `providers.status="approved"` → `Astro.redirect('/dashboard-provider')`.
- [ ] **T2** Crear componente `src/components/onboarding/ProviderWizard.astro` con props `{ trades: Array<{id:number, name:string}>, communes: Array<{id:number, name:string}> }`. Replicar literal los 3 cards de `mockups/create-trade.html:52-77`, `:80-99`, `:102-109` con clases `bg-white p-6 rounded-2xl shadow-sm border border-gray-100`.
- [ ] **T3** Cablear `<form action="/api/v1/providers/me" method="POST">` (handler de HU-21.3). Inputs con `name` correctos: `displayName`, `tradeId`, `bio`, `whatsapp`, `basePriceClp`. Selects `tradeId` y `communeIds[]` poblados desde props (HU-21.2 provee los datos).
- [ ] **T4** Footer del form con 2 botones (`mockups/create-trade.html:111-116`): "Volver" (`<a href="/dashboard-user" class="flex-1 ...">`) y "Crear Perfil" (`<button type="submit" id="provider-wizard-submit" class="flex-[2] bg-primary ...">`).
- [ ] **T5** Slots preparados: dejar `<slot name="cobertura" />` entre bloque 1 y bloque 2 para que HU-21.2 inserte el multi-select de comunas sin refactor mayor.
- [ ] **T6** Validación HTML5 nativa: agregar `required` a `displayName`, `tradeId`, `whatsapp`, `basePriceClp`. `min="1000"` en `basePriceClp`. `maxlength="500"` en `bio`.
- [ ] **T7** Tests:
  - [ ] `tests/e2e/create-trade-render.spec.ts` (Playwright) — verifica los 3 cards renderizan, headings `1. Información Básica`, `2. Contacto y Precios`, `3. Verificación` están presentes, input `displayName` tiene atributo `required`, botón Volver apunta a `/dashboard-user`, sin sesión redirige a `/login`.
  - [ ] `tests/e2e/create-trade-responsive.spec.ts` (Playwright) — viewport 375×667: los 3 grids colapsan a 1 columna (assert `getBoundingClientRect` del último input del grid ≤ viewport width).
  - [ ] Sabotaje 1: en `ProviderWizard.astro`, eliminar el `class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"` del segundo card → snapshot Playwright diff lo marca como rojo → restaurar.
  - [ ] Sabotaje 2: cambiar el `action` del form a `/api/v1/wrong` → test de integración del HU-21.3 fallaría al hacer submit (este HU no lo cubre, pero se documenta el contrato esperado).
  - [ ] Sabotaje 3: borrar el bloque 3 (`mockups/create-trade.html:102-109`) → test E2E verifica que el heading `3. Verificación` sigue presente, falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright `bunx playwright test` → verde (incluye responsive)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados en T7 ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/components/onboarding/ProviderWizard.astro` (snapshot o render estático)
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: port wizard create-trade desde mockup` y push a rama (no merge a main)