# HU-05.5 — Activar y desactivar servicios

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-05-catalogo-servicios

## Historia de usuario

**Como** prestador
**Quiero** desactivar temporalmente un servicio sin eliminarlo
**Para** pausar oferta sin perder datos

## Criterios de aceptación (Gherkin)

### Escenario: Desactivar servicio
  Cuando envío `PATCH /api/v1/providers/me/services/7` con `{"status":"inactive"}`
  Entonces recibo status 200
  Y `services.status="inactive"`

### Escenario: Servicio inactivo no aparece en búsqueda
  Dado un servicio inactivo y el prestador publicado
  Cuando envío `GET /api/v1/search?trade=gasfiter`
  Entonces el resultado no incluye ese servicio

### Escenario: Reactivar servicio lo vuelve a publicar
  Cuando envío `{"status":"active"}`
  Entonces aparece nuevamente en búsqueda

## Tareas técnicas

- [ ] Soporte de `status` en endpoint existente `PATCH /api/v1/providers/me/services/[id]`
- [ ] Filtro en queries de búsqueda (REQ-06) para `status='active'`
- [ ] Tests `tests/integration/services/toggle.test.ts`, `tests/integration/search/excludes-inactive.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
