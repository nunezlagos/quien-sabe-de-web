# HU-24.1 — Esquema provider_availability

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-24-disponibilidad-horaria-prestador
**Rama:** `feat/HU-24.1-schema-availability`

## Tareas técnicas

- [ ] **T1** Agregar tabla `providerAvailability` a `src/database/schema.ts` con PK auto-increment, columnas `providerId`, `dayOfWeek`, `startTime`, `endTime`, `createdAt`. Unique index `(providerId, dayOfWeek, startTime)`. Index secundario `(providerId)`.
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_provider_availability.sql` con `CREATE TABLE` + 4 CHECKs (`day_of_week BETWEEN 0 AND 6`, `start_time GLOB`, `end_time GLOB`, `end_time > start_time`) + UNIQUE index + index secundario + FK cascade.
- [ ] **T3** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio` que la tabla existe con las 5 columnas y 2 índices.
- [ ] **T4** Validador `availabilityRangeSchema` en `src/lib/validators/availability.ts` con regex HH:MM estricto `(?:2[0-3]|[01]\d):[0-5]\d$`, `dayOfWeek 0-6`, refinement `endTime > startTime`. Schema de array `availabilityArraySchema` con tope 50.
- [ ] **T5** Helpers `jsDayToSql()` (0=lunes→0=domingo mapping) y `sqlDayToJs()` en `src/lib/services/availability/dates.ts`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/availability.test.ts` — `availabilityRangeSchema` acepta `{day_of_week:1, start_time:'09:00', end_time:'13:00'}`; rechaza `{start:'13:00', end:'09:00'}`; rechaza `'24:00'`; rechaza `'9:00'` sin zero pad; rechaza `day_of_week:7`; array de 51 elementos rechaza; array de 50 acepta.
  - [ ] `tests/integration/availability/schema.test.ts` — INSERT válido con `(1, 1, '09:00', '13:00')` y `(1, 1, '15:00', '19:00')` coexisten; intento de `(1, 1, '09:00', '13:00')` dos veces falla por UNIQUE; intento de `(1, 1, '14:00', '09:00')` falla por CHECK end > start; FK cascade: borrar provider borra sus availability; EXPLAIN QUERY PLAN sobre `WHERE provider_id = ?` usa `idx_provider_availability_provider`.
  - [ ] Sabotaje 1: en la migración, eliminar `CHECK (end_time > start_time)` → INSERT `(1, 1, '14:00', '09:00')` persiste → test verifica que la fila no existe en DB post-INSERT → restaurar.
  - [ ] Sabotaje 2: en `availabilityRangeSchema`, olvidar la refinement `end > start` → schema acepta rangos invertidos → test con `{start:'13:00', end:'09:00'}` espera throw y recibe éxito → restaurar.
  - [ ] Sabotaje 3: en el schema Drizzle, olvidar el `uniqueIndex(...)` → dos INSERTs con misma `(provider, day, start)` coexisten → test verifica UNIQUE constraint en DB → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/validators/availability.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: schema provider_availability` y push a rama (no merge a main)