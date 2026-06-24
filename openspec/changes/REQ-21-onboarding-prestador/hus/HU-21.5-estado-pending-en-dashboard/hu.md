# HU-21.5 — Banner verificación pendiente en dashboard prestador

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** prestador con perfil pending_verification
**Quiero** ver claramente que mi perfil aún no es público
**Para** entender por qué no aparece en búsqueda

## Criterios de aceptación (Gherkin)

### Escenario: Banner visible mientras pending
  Dado un prestador con `providers.status="pending_verification"`
  Cuando navega a `/dashboard-provider`
  Entonces se renderiza banner amarillo encima del form de edición (`mockups/dashboard-provider.html` antes del bloque línea 126 — Profile Edit Form) con texto "Tu perfil está en revisión" y botón "Ir a verificación"

### Escenario: Banner desaparece tras aprobación
  Dado `providers.status="approved"` (REQ-03 aprobado)
  Cuando carga el dashboard
  Entonces el banner no aparece

### Escenario: Banner rojo si rejected
  Dado `providers.status="rejected"`
  Cuando carga el dashboard
  Entonces banner rojo con motivo y CTA "Reintentar"

## Tareas técnicas

- [ ] Componente `<ProviderStatusBanner />` en `src/components/banners/ProviderStatusBanner.astro` con variantes pending/approved/rejected
- [ ] Insertar en `src/pages/dashboard-provider.astro` arriba del card de edición
- [ ] Estilo reutiliza `bg-yellow-50 border-yellow-200 rounded-2xl p-4 flex items-start gap-3`
- [ ] Tests `tests/e2e/dashboard-provider-status.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
