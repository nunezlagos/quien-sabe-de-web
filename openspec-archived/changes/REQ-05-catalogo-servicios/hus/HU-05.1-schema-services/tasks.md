# HU-05.1 — Schema services y service_coverage

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-05-catalogo-servicios
**Rama:** `feat/HU-05.1-schema-services`

## Tareas tecnicas

- [ ] **T1** Agregar `services` y `serviceCoverage` a `src/database/schema.ts` siguiendo el design (con CHECK `price_clp > 0 OR NULL`, FKs con cascade/restrict, índices por provider/status/sort y por commune).
- [ ] **T2** Generar migración con `docker exec quien-sabe-app bun run db:generate` y revisar `0004_services.sql`.
- [ ] **T3** Aplicar migración con `docker exec quien-sabe-app bun run db:migrate:local`. Verificar que las tablas existen y los índices están creados.
- [ ] **T4** Tests:
  - [ ] `tests/integration/services/schema.test.ts` — INSERT válido; INSERT con `price_clp=-10` falla por CHECK; INSERT sin profile_id falla por FK.
  - [ ] `tests/integration/services/schema-cascade.test.ts` — eliminar provider físicamente elimina sus services y service_coverage; eliminar commune con services asociados falla por FK RESTRICT.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar el CHECK a `price_clp >= 0` (permitir 0) → `tests/integration/services/schema.test.ts` (caso `price_clp=-10`) debe seguir tirando (es el caso negativo extremo) — usar sabotaje distinto: cambiar CHECK a `price_clp > 0` por `price_clp > 1000` → test con `price_clp=500` debe caer → restaurar.
- [ ] **S2** Cambiar `ON DELETE CASCADE` por `ON DELETE SET NULL` en `services.provider_id` → eliminar provider NO elimina services; `tests/integration/services/schema-cascade.test.ts` debe caer (cuenta de filas != 0) → restaurar.
- [ ] **S3** Eliminar el índice `idx_service_coverage_commune` de la migración → `EXPLAIN QUERY PLAN` sobre `WHERE commune_id = ?` debe pasar a `SCAN` (verificable en test que verifica `sqlite_master`) → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en módulos afectados (schema validado vía integration tests)
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
