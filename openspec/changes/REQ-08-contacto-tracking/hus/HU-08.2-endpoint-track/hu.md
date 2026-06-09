# HU-08.2 — Endpoint POST /contacts/track con rate-limit

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-08-contacto-tracking

## Historia de usuario

**Como** cliente del perfil público
**Quiero** registrar un contacto efectivo antes de redirigir
**Para** alimentar la métrica de OE2

## Criterios de aceptación (Gherkin)

### Escenario: POST con body válido registra evento
  Cuando envío `POST /api/v1/contacts/track` con `{"provider_id":42,"kind":"whatsapp"}`
  Entonces recibo status 204
  Y existe una fila en `contact_events` con `provider_id=42, kind="whatsapp"`
  Y `ip_hash` y `ua_hash` están calculados con SHA-256 + salt mensual

### Escenario: Provider inexistente → 422
  Cuando envío `provider_id=99999`
  Entonces recibo status 422 con `{ "error": "provider inválido" }`

### Escenario: Rate limit por ip_hash > 30/hora → 429
  Dado un ip_hash que ya hizo 30 requests en la última hora
  Cuando envía el 31
  Entonces recibo status 429
  Y NO se inserta

### Escenario: Body inválido → 400
  Cuando envío `{"provider_id":"no-num"}`
  Entonces recibo status 400

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/contacts/track.ts`
- [ ] Helper `hashIpUa(ip, ua, salt)` en `src/lib/utils/hash.ts`
- [ ] Rate limit en KV con clave `rl:contact:<ip_hash>` y TTL 1 h
- [ ] Salt mensual rotado por cron (otro REQ); por ahora env `CONTACT_HASH_SALT`
- [ ] Tests `tests/unit/utils/hash.test.ts`, `tests/integration/contacts/track.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
