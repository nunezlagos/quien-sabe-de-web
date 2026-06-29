# HU-08.1 — Schema contact_events con índices

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-08-contacto-tracking

## Historia de usuario

**Como** sistema
**Quiero** registrar eventos de contacto sin PII
**Para** medir contactos efectivos (OE2) sin guardar datos personales

## Criterios de aceptación (Gherkin)

### Escenario: Tabla creada con índices
  Cuando se aplica la migración
  Entonces existe `contact_events (id, provider_id, kind, ip_hash, ua_hash, created_at)`
  Y hay índice por `provider_id` y `(provider_id, created_at desc)`

### Escenario: ip_hash y ua_hash son strings hex de 64 chars
  Cuando se inserta un evento
  Entonces ambos campos tienen longitud 64 (SHA-256 hex)

### Escenario: Kind validado a enum
  Cuando intento insertar `kind="otro"`
  Entonces el CHECK falla — sólo se aceptan `whatsapp|phone|email`

## Tareas técnicas

- [ ] Schema `contact_events` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_contact_events.sql`
- [ ] Tests `tests/integration/contacts/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
