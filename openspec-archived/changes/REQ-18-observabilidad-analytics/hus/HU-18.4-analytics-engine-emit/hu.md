# HU-18.4 — Doble emisión a Cloudflare Analytics Engine

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** sistema
**Quiero** emitir eventos también al binding ANALYTICS de Cloudflare
**Para** tener queries baratas y rápidas para dashboard

## Criterios de aceptación (Gherkin)

### Escenario: Emisión paralela a D1 y ANALYTICS
  Cuando se procesa un evento
  Entonces se inserta en `events_log` Y se llama `env.ANALYTICS.writeDataPoint({...})`

### Escenario: Falla de ANALYTICS no rompe el insert D1
  Dado el binding ANALYTICS lanza
  Cuando se procesa el evento
  Entonces D1 igual inserta y la respuesta es 204

### Escenario: Sin binding ANALYTICS configurado, sólo D1
  Dado `env.ANALYTICS` undefined
  Cuando se procesa
  Entonces sólo se inserta D1 y no se lanza

## Tareas técnicas

- [ ] Cliente `src/lib/services/analytics/engine.ts` con guard de binding
- [ ] Hook en handler `events/track.ts`
- [ ] Tests `tests/integration/events/analytics-engine.test.ts` con mock del binding

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
