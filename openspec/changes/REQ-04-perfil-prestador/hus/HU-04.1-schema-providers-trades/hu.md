# HU-04.1 — Schema providers + trades con seed

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** sistema
**Quiero** modelar la entidad prestador y la taxonomía de oficios
**Para** soportar perfiles públicos y búsqueda

## Criterios de aceptación (Gherkin)

### Escenario: Migración crea tablas providers y trades
  Cuando se aplica la migración inicial de prestadores
  Entonces existen las tablas `providers` y `trades`
  Y `providers` tiene FK a `users.id`, `trades.id` y `communes.id`
  Y el slug generado sigue el patrón `<nombre>-<apellido>-<oficio-slug>-<comuna-slug>` (ej. `juan-perez-gasfiter-las-condes`)

### Escenario: Seed inicial de oficios
  Cuando se aplica el seed
  Entonces existen al menos `gasfiter`, `electricista`, `jardinero`, `gasista`, `pintor` en `trades`
  Y cada uno tiene `slug` único

### Escenario: Constraint user_id único en providers
  Dado un usuario con id=10 ya con perfil de prestador
  Cuando intento insertar otro perfil con `user_id=10`
  Entonces D1 rechaza con constraint violation

## Tareas técnicas

- [ ] Schema `providers` en `src/database/schema.ts` (id, user_id UNIQUE, trade_id, commune_id, description, photo_r2_key, phone, whatsapp, hourly_rate_clp, status, slug)
- [ ] Schema `trades` en `src/database/schema.ts`
- [ ] Migración `src/database/migrations/00XX_providers_trades.sql`
- [ ] Seed de oficios iniciales
- [ ] Tests `tests/integration/providers/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
