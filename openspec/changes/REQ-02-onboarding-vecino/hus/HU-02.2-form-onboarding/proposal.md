# Propuesta — HU-02.2 — Wizard de onboarding con Zod

**Estado:** propuesta | **REQ padre:** REQ-02-onboarding-vecino

## Contexto

Tras registrarse (REQ-01), un vecino llega a la plataforma con `commune_id=NULL` y sin consentimientos. La Ley 19.628 obliga a registrar aceptación explícita de términos antes de tratar datos personales. Esta HU implementa el endpoint `POST /api/v1/users/me/profile` (con POST/PATCH/GET) que completa el perfil: comuna obligatoria del catálogo HU-02.1, aceptación de términos versionada, marca `onboarded_at`. Es el primer paso tangible del vecino después del registro.

## Mockups de referencia

- No existe mockup para `/onboarding`. **Mockup TBD** — la vista `src/pages/onboarding.astro` y el componente `Wizard.astro` se diseñan en esta HU siguiendo el patrón wizard 3 pasos del estilo ya establecido en `mockups/verification.html:51-75` (steps con número, conectores, color primario para paso activo).

## Alternativas consideradas

### Opcion A — Wizard 3 pasos con POST único al final
- Step 1: comuna (select del catálogo).
- Step 2: preferencias (HU-02.3).
- Step 3: consentimientos (checkboxes `accepted_terms`, `accepted_privacy`, `terms_version`).
- Cliente acumula estado, hace UN `POST /api/v1/users/me/profile` con todo.
- Pro: una transacción, menos round-trips, validación Zod unificada.
- Contra: si el usuario abandona en step 2, no queda progreso parcial (mitigable con `PATCH` posterior).

### Opcion B — Un endpoint por step
- Pro: granularidad, progreso guardable.
- Contra: 3 endpoints, 3 transacciones, más superficie de bug; comuna es obligatoria y bloqueante de todos modos.

### Opcion C — Single-page form largo
- Contra: UX pobre en mobile; no hay progresión visible.

## Decision

Se elige **Opcion A** para el MVP. La comuna es bloqueante (no se puede usar la plataforma sin comuna). Las preferencias son opcionales. Los consentimientos son obligatorios por ley. El endpoint acepta los 3 bloques juntos con Zod estricto; el frontend los junta del wizard state.

## Riesgos y mitigaciones

- Riesgo: comuna inexistente (id inventado por el cliente) → Mitigación: Zod `.refine()` consulta `communes` y falla con 422 `comuna inválida`.
- Riesgo: `terms_version` desactualizado → Mitigación: el backend sólo acepta la `TERMS_VERSION` vigente (constante); cualquier valor distinto → 422.
- Riesgo: el usuario re-envía onboarding con comuna cambiada → Mitigación: `POST` es upsert; `onboarded_at` no cambia si ya existía; `commune_id` sí.
- Riesgo: un vecino marca `accepted_terms: false` por bug de cliente → Mitigación: Zod requiere `=== true`; el endpoint devuelve 400 explícito.

## Metrica de exito

- `POST /api/v1/users/me/profile` con body válido → 200, fila en `users` con `commune_id`, `onboarded_at`, `accepted_terms_at` no nulos.
- Body sin `accepted_terms: true` → 400 `debe aceptar términos`.
- Body con `commune_id: 99999` → 422 `comuna inválida`.
- Re-POST con comuna cambiada → 200, `commune_id` actualizado, `onboarded_at` sin cambio.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/pages/api/v1/users/me/profile.ts` y `src/lib/validators/onboarding.ts`.
