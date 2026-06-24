# HU-05.5 — Activar y desactivar servicios

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-05-catalogo-servicios
**Rama:** `feat/HU-05.5-toggle-disponibilidad`

## Tareas tecnicas

- [ ] **T1** Extender `queryBuilder` de HU-06.1 con flag `includeInactive` (default `false`). Para queries públicas, `includeInactive=false` agrega `WHERE s.status = 'active'`.
- [ ] **T2** Verificar que `listServicesByProvider` (HU-05.2) NO usa `queryBuilder` y devuelve todos los status — el prestador dueño ve sus inactivos.
- [ ] **T3** Tests:
  - [ ] `tests/integration/services/toggle.test.ts` — PATCH `status: 'inactive'` → 200, fila actualizada; reactivación simétrica.
  - [ ] `tests/integration/search/excludes-inactive.test.ts` — seed: 1 prestador con 1 activo + 1 inactivo. `GET /api/v1/search` retorna sólo el activo. `GET /api/v1/providers/me/services` retorna ambos.
  - [ ] `tests/unit/search/queryBuilder.test.ts` (extiende HU-06.1) — el builder aplica `WHERE s.status = 'active'` para queries públicas; con `includeInactive=true` no lo aplica.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Quitar el `WHERE s.status = 'active'` del `queryBuilder` (dejar siempre `includeInactive=true`) → `tests/integration/search/excludes-inactive.test.ts` debe caer (la búsqueda devuelve el inactivo) → restaurar.
- [ ] **S2** Aplicar el filtro `status='active'` también en `listServicesByProvider` (rompiendo el caso del dueño) → `tests/integration/search/excludes-inactive.test.ts` debe caer (el endpoint del prestador no devuelve el inactivo) → restaurar.
- [ ] **S3** Cambiar el enum del Zod para aceptar `'enabled'` en vez de `'active'` → `tests/integration/services/toggle.test.ts` (PATCH `status: 'inactive'`) debe seguir verde pero el PATCH `status: 'active'` debe tirar Zod → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/search/queryBuilder.ts` y servicios de services
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
