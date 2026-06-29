# HU-18.3 — Endpoint POST /events/track con rate-limit

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** cliente
**Quiero** registrar eventos en el backend
**Para** alimentar dashboard y agregaciones

## Criterios de aceptación (Gherkin)

### Escenario: POST válido inserta evento
  Cuando envío `POST /api/v1/events/track` con `{"event":"search","props":{"trade":"gasfiter"}}`
  Entonces recibo status 204
  Y existe fila con `event="search"`, `props_json` validado y `actor_role` derivado de sesión (o `anonymous`)

### Escenario: Payload con PII rechazado
  Cuando envío `props: {"email":"a@b.cl"}`
  Entonces recibo status 422 con `{ "error": "props con PII no permitidas" }`

### Escenario: Rate limit por IP-hash
  Dado 100 requests en 1 min desde el mismo ip_hash
  Cuando llega el 101
  Entonces recibo status 429

### Escenario: Evento desconocido → 422
  Cuando envío `event="random"`
  Entonces recibo 422

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/events/track.ts`
- [ ] Zod schema por evento en `src/lib/validators/events.ts`
- [ ] Rate limit en KV (clave `rl:event:<ip_hash>`)
- [ ] Tests `tests/integration/events/track.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
