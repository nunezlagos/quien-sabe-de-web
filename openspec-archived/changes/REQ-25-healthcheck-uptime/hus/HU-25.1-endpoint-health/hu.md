# HU-25.1 — Endpoint /health con bindings y latencias

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-25-healthcheck-uptime

## Historia de usuario

**Como** servicio de monitoreo
**Quiero** consultar el estado de los bindings del Worker
**Para** detectar fallas tempranas

## Criterios de aceptación (Gherkin)

### Escenario: Todos los bindings ok
  Cuando hago `GET /api/v1/health`
  Entonces recibo status 200 con JSON
  ```
  {
    "status":"ok",
    "components":{
      "d1":{"status":"ok","latency_ms":<N>},
      "kv":{"status":"ok","latency_ms":<N>},
      "r2":{"status":"ok","latency_ms":<N>},
      "ses":{"status":"ok","latency_ms":<N>}
    }
  }
  ```

### Escenario: D1 caído → degraded
  Dado D1 timeout
  Cuando hago GET /health
  Entonces recibo status 200 con `status:"degraded"` y `d1.status:"down"`

### Escenario: Latencias bajo 200ms
  Cuando ejecuto el endpoint 100 veces en staging
  Entonces el p95 es < 200ms

### Escenario: Timeout por binding 1s
  Cuando un binding tarda > 1s
  Entonces se reporta `status:"timeout"` sin colgar el endpoint global

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/health.ts`
- [ ] Helper `checkBinding(name, fn, timeoutMs)` en `src/lib/services/health/check.ts`
- [ ] Probes: D1 `SELECT 1`, KV `get('health-probe')`, R2 `head('health.txt')`, SES no-op (cliente init)
- [ ] Tests `tests/integration/health/health.test.ts` con miniflare

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
