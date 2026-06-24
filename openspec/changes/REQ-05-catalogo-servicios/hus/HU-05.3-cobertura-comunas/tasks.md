# HU-05.3 — Cobertura multi-comuna del servicio

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-05-catalogo-servicios
**Rama:** `feat/HU-05.3-cobertura-comunas`

## Tareas tecnicas

- [ ] **T1** Extender `servicePatchSchema` con `coverageCommuneIds: z.array(z.number().int().positive()).max(60).optional()`.
- [ ] **T2** Servicio `service-coverage.ts` con `replaceCoverage(db, serviceId, communeIds)` (transacción Drizzle) y `getCoverageForService`.
- [ ] **T3** Servicio `getCoverageForService` retorna JOIN resuelto `{ id, slug, name }[]` para incluir en el response del PATCH.
- [ ] **T4** Modificar `updateService` (HU-05.2) para invocar `replaceCoverage` dentro de la misma tx cuando `coverageCommuneIds` está presente. Si falla, rollback del UPDATE.
- [ ] **T5** Modificar handler `PATCH /api/v1/providers/me/services/[id]` para devolver 422 con `invalid_ids` cuando hay communes inexistentes.
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/services.test.ts` (extender) — `coverageCommuneIds` con 61 elementos rechazado; array vacío OK.
  - [ ] `tests/integration/services/coverage.test.ts` — happy path 3 comunas; reemplazar por 1; array vacío limpia; commune inexistente 422; atomicidad con spy.
  - [ ] `tests/integration/services/coverage-ownership.test.ts` — PATCH con coverage sobre servicio ajeno → 403, coverage ajeno intacto.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Quitar la transacción Drizzle (usar DELETE + INSERT separados) → `tests/integration/services/coverage.test.ts` (atomicidad spy) debe caer → restaurar.
- [ ] **S2** Eliminar la validación de communes existentes → `tests/integration/services/coverage.test.ts` (caso commune inexistente 99999) debe pasar a 200 y romper el test → restaurar.
- [ ] **S3** No dedupe el array → enviar `[13114, 13114]` genera constraint violation por PK compuesta → `tests/integration/services/coverage.test.ts` (caso duplicado) debe tirar → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/service-coverage.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
