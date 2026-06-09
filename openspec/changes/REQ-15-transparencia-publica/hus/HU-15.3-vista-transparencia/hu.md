# HU-15.3 — Vista pública /transparency con widgets

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** visitante anónimo
**Quiero** ver el estado financiero de la plataforma
**Para** confiar en la gestión transparente

## Criterios de aceptación (Gherkin)

### Escenario: GET /transparency renderiza widgets
  Cuando visito `/transparency`
  Entonces el HTML incluye widgets: total donaciones YTD, total gastos YTD, ratio, gráfico por mes

### Escenario: Datos agregados sin PII
  Cuando se renderiza
  Entonces ningún payload incluye email/nombre de donantes

### Escenario: Endpoint público alimenta la vista
  Cuando envío `GET /api/v1/public/transparency/summary`
  Entonces respuesta JSON cacheada 5 min

## Tareas técnicas

- [ ] Vista `src/pages/transparency.astro`
- [ ] Endpoint `src/pages/api/v1/public/transparency/summary.ts`
- [ ] Componentes `src/components/transparency/*.astro`
- [ ] Tests `tests/integration/transparency/summary.test.ts`, `tests/e2e/transparency-view.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
