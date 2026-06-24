# HU-04.5 — Reindex de búsqueda al cambiar oficio o comuna

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-04-perfil-prestador
**Rama:** `feat/HU-04.5-reindex-on-update`

## Tareas tecnicas

- [ ] **T1** Extender `updateProvider(db, userId, patch)` en `src/lib/services/providers.ts` para retornar `{ provider, needsReindex, changedKeys }`.
- [ ] **T2** Crear `src/lib/services/search/indexer.ts` con firma `reindexProvider(db, providerId): Promise<void>` y cuerpo no-op por ahora (HU-06.1 implementa). Exporta la firma para que HU-04.2 la importe.
- [ ] **T3** Modificar handler `PATCH /api/v1/providers/me` (de HU-04.2) para invocar `reindexProvider` cuando `needsReindex=true`. Capturar errores con `try/catch` + log (no romper el PATCH).
- [ ] **T4** Inyectar `reindexProvider` como dependencia testeable: el handler recibe una función opcional por `Astro.locals` o se importa directo (tests usan `vi.spyOn`).
- [ ] **T5** Tests:
  - [ ] `tests/unit/services/update-provider.test.ts` — cada combinación de patch, verificar `changedKeys` y `needsReindex`.
  - [ ] `tests/unit/search/indexer.test.ts` — firma existe y retorna sin error (no-op).
  - [ ] `tests/integration/providers/reindex.test.ts` — spy: PATCH `trade_id` → 1 call; PATCH `commune_id` → 1 call; PATCH `description` → 0 calls; PATCH `phone` → 0 calls.
  - [ ] `tests/integration/search/reflects-update.test.ts` — fixture: 1 provider con `trade_id=1`; PATCH a `trade_id=2`; `GET /api/v1/search?trade=2` lo incluye, `?trade=1` no.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Eliminar la condición `changedKeys.some(k => k === 'tradeId' || k === 'communeId')` en `updateProvider` (siempre `needsReindex=false`) → `tests/integration/providers/reindex.test.ts` (caso PATCH `trade_id`) debe caer → restaurar.
- [ ] **S2** Quitar el `try/catch` alrededor de `reindexProvider` en el handler y forzar a la función a tirar error en test → el PATCH debe devolver 500 (verificable con test que espera status 500) → restaurar (debe ser 200 + log).
- [ ] **S3** Cambiar la lógica de diff para usar `==` en vez de `!==` (clásico bug con `null`) → `tests/unit/services/update-provider.test.ts` debe caer al setear `description: ''` sobre `description: 'algo'` → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/providers.ts` y `src/lib/services/search/indexer.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
