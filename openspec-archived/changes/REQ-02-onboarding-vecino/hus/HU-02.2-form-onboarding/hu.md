# HU-02.2 — Wizard de onboarding con Zod

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-02-onboarding-vecino

## Historia de usuario

**Como** vecino recién registrado
**Quiero** completar mi perfil con comuna y consentimientos
**Para** habilitar el uso pleno de la plataforma

## Criterios de aceptación (Gherkin)

### Escenario: POST onboarding válido completa perfil
  Dado un usuario "ana@ejemplo.cl" con `onboarded_at = NULL`
  Cuando envío `POST /api/v1/users/me/profile` con `{"commune_id": 13114, "accepted_terms": true, "terms_version": "v1"}`
  Entonces recibo status 200
  Y la fila en `users` tiene `commune_id=13114`, `onboarded_at` no nulo y `accepted_terms_at` no nulo

### Escenario: Falta aceptar términos → 400
  Cuando envío `POST /api/v1/users/me/profile` con `accepted_terms: false`
  Entonces recibo status 400 con `{ "error": "debe aceptar términos" }`
  Y `onboarded_at` queda nulo

### Escenario: Comuna inexistente → 422
  Cuando envío `POST /api/v1/users/me/profile` con `commune_id: 99999`
  Entonces recibo status 422 con `{ "error": "comuna inválida" }`

### Escenario: Re-envío del onboarding actualiza sin duplicar
  Dado un usuario ya onboardeado
  Cuando envía un nuevo POST con otra comuna
  Entonces recibo status 200
  Y `onboarded_at` no cambia, pero `commune_id` sí

## Tareas técnicas

- [ ] Schema Zod `OnboardingBody` en `src/lib/validators/onboarding.ts`
- [ ] Endpoint `src/pages/api/v1/users/me/profile.ts` (POST/PATCH/GET)
- [ ] Componente Astro `src/components/onboarding/Wizard.astro` con 3 pasos
- [ ] Vista `src/pages/onboarding.astro`
- [ ] Tests `tests/unit/validators/onboarding.test.ts`, `tests/integration/onboarding/post.test.ts`, `tests/e2e/onboarding-flow.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
