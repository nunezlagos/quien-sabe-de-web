# HU-05.2 — CRUD de servicios del prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-05-catalogo-servicios
**Rama:** `feat/HU-05.2-crud-servicios`

## Tareas tecnicas

- [ ] **T1** Definir `serviceCreateSchema`, `servicePatchSchema` en `src/lib/validators/services.ts` con validaciones de título, precio positivo, enum unit, status opcional.
- [ ] **T2** Helper `normalizeTitle(raw)` en `src/lib/services/services.ts` (trim + colapsar espacios + capitalize sólo el primer char).
- [ ] **T3** Servicio `services.ts` con `listServicesByProvider`, `createService` (calcula `sort_order`), `updateService`, `deleteService`. `updateService` acepta `coverageCommuneIds` y delega a `replaceCoverage` (stub por ahora, HU-05.3 implementa).
- [ ] **T4** Endpoint `src/pages/api/v1/providers/me/services/index.ts` con GET y POST. Validación de sesión + Zod + ownership.
- [ ] **T5** Endpoint `src/pages/api/v1/providers/me/services/[id].ts` con PATCH y DELETE. Validación de ownership con subquery.
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/services.test.ts` — Zod rechaza inválidos, acepta boundary.
  - [ ] `tests/unit/services/services.test.ts` — `normalizeTitle` (espacios dobles, capitalize, no-op en "iPhone"); `sort_order` incremental.
  - [ ] `tests/integration/services/crud.test.ts` — round-trip GET/POST/PATCH/DELETE; 404 sin perfil; 403 sobre servicio ajeno; DELETE cascade borra service_coverage.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Quitar la validación de ownership en PATCH/DELETE → `tests/integration/services/crud.test.ts` (caso servicio ajeno) debe pasar a 200 en vez de 403 → restaurar.
- [ ] **S2** Cambiar el cálculo de `sort_order` para usar siempre `0` → segundo POST debe tener `sort_order=0` también, rompiendo el test de orden → restaurar.
- [ ] **S3** Cambiar `normalizeTitle` para que aplique `.toUpperCase()` al título completo → `tests/unit/services/services.test.ts` (caso "iPhone") debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/services.ts` y `src/lib/validators/services.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
