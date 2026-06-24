# HU-24.2 — CRUD horario semanal del prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-24-disponibilidad-horaria-prestador
**Rama:** `feat/HU-24.2-crud-horario-prestador`

## Tareas técnicas

- [ ] **T1** Helper `validateNoOverlap(ranges)` en `src/lib/services/availability/validate.ts` con sort por día+hora y throw `OverlapError` con mensaje específico.
- [ ] **T2** Servicio `src/lib/services/availability/crud.ts` con:
  - `getProviderAvailability(env, providerId)` — `SELECT * FROM provider_availability WHERE provider_id = ? ORDER BY day_of_week, start_time`.
  - `replaceProviderAvailability(env, providerId, ranges)` — `db.batch([DELETE WHERE provider_id = ?, INSERT VALUES (...)])`.
- [ ] **T3** Endpoint `src/pages/api/v1/providers/me/availability.ts` con handlers `GET` y `PUT`:
  - GET: `requireRole('prestador')` → 401/403; `getProviderAvailability`; responde 200.
  - PUT: `requireRole('prestador')` → 401/403; `availabilityArraySchema.parse` → 400; `validateNoOverlap` → 422; `replaceProviderAvailability`; responde 200 con array final.
- [ ] **T4** Endpoint `src/pages/api/v1/providers/[id]/availability.ts` con handler `GET` público: lee provider por id (404 si no existe); `getProviderAvailability`; responde 200.
- [ ] **T5** Componente `src/components/availability/WeeklyScheduleGrid.astro` con prop `{ initialRanges }`. Mockup base `mockups/dashboard-provider.html:229-352`. Isla `client:load` para toggles y submit.
- [ ] **T6** Integrar `<WeeklyScheduleGrid>` en `src/pages/dashboard-provider.astro` (REQ-12), después del card "Mis Servicios Activos", con prop `initialRanges={provider.availability}`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/services/validate-overlap.test.ts` — acepta `[{day:1, 9-12}, {day:2, 9-12}]`; rechaza `[{day:1, 9-12}, {day:1, 11-13}]` con `OverlapError("rangos solapados día 1")`; acepta `[{day:1, 9-13}, {day:1, 14-18}]` contiguos.
  - [ ] `tests/integration/availability/crud.test.ts` — PUT con 3 rangos válidos inserta y borra anteriores; PUT con solapamiento devuelve 422; GET propio con sesión prestador devuelve array actual; GET público sin sesión funciona y no requiere auth; transacción rollback si INSERT 3 falla (verifica que filas anteriores persisten); PUT sin sesión devuelve 401.
  - [ ] Sabotaje 1: en `replaceProviderAvailability`, no usar `db.batch` y usar DELETE + INSERT secuencial → INSERT 3 inválido deja tabla inconsistente → test verifica que la fila INSERT 1 sigue ahí y la 2 también (transaccionalidad rota) → restaurar.
  - [ ] Sabotaje 2: en el endpoint PUT, olvidar la validación `validateNoOverlap` → PUT con solapamiento crea filas conflictivas → test verifica 422 → restaurar.
  - [ ] Sabotaje 3: en el GET público, olvidar el 404 cuando provider no existe → devuelve array vacío para provider inexistente → test verifica 404 → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (carga, edición, guardado)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/availability/crud.ts` y `src/lib/services/availability/validate.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: CRUD horario semanal del prestador` y push a rama (no merge a main)