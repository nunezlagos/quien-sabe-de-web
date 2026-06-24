# HU-07.3 — Sección de catálogo de servicios en perfil

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-07-perfil-publico
**Rama:** `feat/HU-07.3-seccion-servicios`

## Tareas técnicas

- [ ] **T1** Helper `formatPriceClp(value: number | null): string` en `src/lib/utils/format.ts`:
  - `null` → `"Consultar"`.
  - `0` → `Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(0)`.
  - número positivo → mismo `Intl.NumberFormat`.
- [ ] **T2** Extender `PublicService` en `src/lib/dto/providers.ts` con `description?: string | null` y `coverage: string[]`.
- [ ] **T3** Extender el servicio `getPublicProviderByIdOrSlug` en `src/lib/services/providers.ts` para incluir `description` (de `services.description`) y `coverage` (de `service_coverage` JOIN `communes`). Mantener backward compatibility en tests existentes.
- [ ] **T4** Componente `src/components/providers/ServicesSection.astro`:
  - Props: `services: PublicService[]`.
  - Si `services.length === 0` → no renderiza (early return).
  - Header con icono `ri-list-check` y título "Servicios y Precios".
  - Info-box azul "Precios referenciales..." (mockup `profile.html:132-135`).
  - `<ul>` con un `<li>` por servicio:
    - Nombre izquierda, precio formateado derecha (`formatPriceClp`).
    - Descripción debajo en `text-xs text-gray-400` si existe.
    - Chips de cobertura con icono `ri-map-pin-line` y `flex flex-wrap gap-1 mt-1`.
  - Borde `border-b border-gray-100 last:border-0`.
- [ ] **T5** Integrar `<ServicesSection services={provider.services} />` en `PublicProfile.astro` después de `<Description>`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/format.test.ts` — `formatPriceClp(null) === "Consultar"`, `(0) === "$0"`, `(25000) === "$25.000"`, `(1500000) === "$1.500.000"`, `(-1) === "-$1"` (no se valida negativo en runtime, pero queda documentado).
  - [ ] `tests/unit/components/services-section.test.ts` — render con 3 servicios: assert orden, assert precio formateado, assert chip "Las Condes" cuando hay cobertura.
  - [ ] `tests/unit/components/services-section.test.ts` — `services=[]` → no renderiza `<section>`.
  - [ ] `tests/integration/providers/services-section.test.ts` — seed 3 servicios (activo order=0, inactivo, activo order=1 sin precio, activo order=2 con 3 comunas); GET `/p/<slug>`; assert HTML contiene sólo los 2 activos en orden, contiene "Consultar", contiene 3 chips de comuna.
  - [ ] `tests/e2e/profile-services.spec.ts` — Playwright carga perfil real, assert `ul#profile-services-list li` count.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: cambiar `Intl.NumberFormat('es-CL', ...)` por `Intl.NumberFormat('en-US', ...)` → test `(25000) === "$25.000"` cae (formato cambia a `25,000`) → restaurar
- [ ] Sabotaje 2: invertir el `if (services.length === 0) return null` con un placeholder → test E2E "perfil sin servicios → no aparece" falla → restaurar
- [ ] Sabotaje 3: olvidar el filtro `status='active'` al construir la lista → test "servicio inactivo no aparece" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/format.ts` y `src/components/providers/ServicesSection.astro`
- [ ] Type check verde
- [ ] Commit `feat: sección servicios en perfil público con formato CLP` y push
