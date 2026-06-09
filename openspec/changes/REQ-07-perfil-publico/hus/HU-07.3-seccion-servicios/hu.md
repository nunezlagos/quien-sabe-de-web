# HU-07.3 — Sección de catálogo de servicios en perfil

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-07-perfil-publico

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver el catálogo de servicios del prestador
**Para** saber qué ofrece y a qué precio

## Criterios de aceptación (Gherkin)

### Escenario: Lista de servicios activos ordenada
  Dado un prestador con 3 servicios activos en orden 0,1,2
  Cuando renderiza su perfil
  Entonces los servicios aparecen en ese orden

### Escenario: Servicios inactivos no aparecen
  Dado un servicio con `status="inactive"`
  Cuando renderiza el perfil
  Entonces ese servicio NO aparece

### Escenario: Servicio con precio oculto muestra 'Consultar'
  Dado un servicio con `price_clp` null
  Cuando renderiza
  Entonces muestra el texto "Consultar"

### Escenario: Cobertura por comuna se lista
  Dado un servicio con 3 comunas en `service_coverage`
  Cuando renderiza
  Entonces se listan las 3 comunas como chips

## Tareas técnicas

- [ ] Componente `src/components/providers/ServicesSection.astro`
- [ ] Helper `formatPriceClp(value | null)` con fallback 'Consultar'
- [ ] Tests `tests/integration/providers/services-section.test.ts`, `tests/e2e/profile-services.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
