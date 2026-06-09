# HU-18.2 — Helper cliente track(event, props)

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** frontend
**Quiero** emitir eventos al backend desde botones y flujos
**Para** registrar interacciones sin código repetido

## Criterios de aceptación (Gherkin)

### Escenario: track invoca sendBeacon
  Cuando llamo `track("search", {trade:"gasfiter"})`
  Entonces se invoca `navigator.sendBeacon("/api/v1/events/track", payload)`

### Escenario: Helper omite PII automáticamente
  Cuando llamo `track("search", {email:"a@b.cl"})`
  Entonces el payload final NO incluye `email` (sanitización por allowlist)

### Escenario: Fallo silencioso sin lanzar
  Dado sendBeacon retorna false
  Cuando se llama
  Entonces NO se lanza error y se hace `fetch` con `keepalive:true` como fallback

## Tareas técnicas

- [ ] Helper `src/lib/client/track.ts`
- [ ] Allowlist de props por evento en `src/lib/client/eventSchemas.ts`
- [ ] Tests `tests/unit/client/track.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
