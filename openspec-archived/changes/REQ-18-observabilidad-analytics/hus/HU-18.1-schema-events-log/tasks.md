# HU-18.1 — Schema events_log con índices

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.1-schema-events-log`

## Tareas técnicas

- [ ] **T1** Agregar tabla `events_log` a `src/database/schema.ts` siguiendo `design.md` (id ULID, event, actor_role, props_json, created_at) con índices `idx_events_log_event` y `idx_events_log_event_created_desc(event, created_at DESC)`.
- [ ] **T2** Helper ULID en `src/lib/utils/ulid.ts` (si no existe de HU-15.1). Genera 26 chars Crockford base32.
- [ ] **T3** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_events_log.sql` con CHECKs:
  - `event IN ('signup','search','contact','review','donation','ticket_open')`
  - `actor_role IN ('anonymous','user','provider','admin')`
  - `json_valid(props_json)` (verificar en primer `db:migrate:local`; si D1 no soporta, dejar sólo el de enum y delegar validación JSON a HU-18.3)
- [ ] **T4** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio`.
- [ ] **T5** Tests:
  - [ ] `tests/integration/events/schema.test.ts` — tabla creada, índices presentes en `sqlite_master`, CHECK enum rechaza valor inválido, `json_valid` rechaza string no-JSON (si soportado), inserción válida funciona.
  - [ ] `tests/unit/utils/ulid.test.ts` — genera 26 chars, orden monotónico aproximado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: eliminar CHECK `event IN (...)` → test rojo (insert con `event='random'` pasa) → restaurar
- [ ] Sabotaje 2: cambiar índice a sólo `(event)` sin `created_at` → query `WHERE event=? ORDER BY created_at DESC` no usa índice, EXPLAIN muestra SCAN → restaurar
- [ ] Type check verde
- [ ] Commit `feat: schema events_log + índices` y push