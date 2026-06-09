# HU-18.1 — Schema events_log con índices

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-18-observabilidad-analytics

## Historia de usuario

**Como** sistema
**Quiero** modelar el log de eventos analíticos
**Para** soportar dashboard y debug

## Criterios de aceptación (Gherkin)

### Escenario: Tabla creada con índices
  Cuando se aplica la migración
  Entonces existe `events_log (id, event, actor_role, props_json, created_at)`
  Y hay índices por `event` y `(event, created_at desc)`

### Escenario: Event enum válido
  Cuando inserto `event="otro"`
  Entonces el CHECK falla — sólo `signup|search|contact|review|donation|ticket_open`

### Escenario: props_json válido
  Cuando inserto `props_json` con string no-JSON
  Entonces la inserción falla

## Tareas técnicas

- [ ] Schema `events_log` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_events.sql`
- [ ] Tests `tests/integration/events/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
