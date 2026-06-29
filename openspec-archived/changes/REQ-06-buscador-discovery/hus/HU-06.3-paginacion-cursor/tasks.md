# HU-06.3 — Paginación cursor-based estable

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.3-paginacion-cursor`

## Tareas tecnicas

- [ ] **T1** Verificar/crear índice `idx_providers_created_id ON providers(created_at DESC, id DESC)`. Si no existe, agregar a una migración `0005_search_indexes.sql`.
- [ ] **T2** Helpers `encodeCursor` y `decodeCursor` en `src/lib/utils/cursor.ts` con `CursorInvalidError` tipado. Usar `base64url` (no base64).
- [ ] **T3** Extender `queryBuilder.buildSearchQuery` para aceptar `cursor` y emitir keyset WHERE sobre `(created_at, id)`. Documentar que aplica sólo con `sort=recent` o default.
- [ ] **T4** Extender `searchProviders` para calcular el siguiente cursor (encodea último item) y devolverlo como `cursor: string | null`.
- [ ] **T5** Handler mapea `CursorInvalidError` a 400 con `{ error: "cursor inválido" }`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/cursor.test.ts` — encode/decode round-trip; corrupto tira; shape inválido tira.
  - [ ] `tests/unit/search/queryBuilder.test.ts` (extender) — SQL contiene keyset WHERE cuando cursor presente.
  - [ ] `tests/integration/search/pagination.test.ts` — 25 prestadores seed; 2 páginas cubren 20 sin duplicados; última `cursor=null`; corrupto 400.
  - [ ] `tests/integration/search/pagination-concurrent.test.ts` — insert entre páginas no duplica ni pierde.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar keyset WHERE por `OFFSET ?` paginación → `tests/integration/search/pagination-concurrent.test.ts` debe caer (alguno se duplica o se pierde) → restaurar.
- [ ] **S2** Cambiar `decodeCursor` para que NO valide el shape (sólo parsee JSON) → `tests/unit/utils/cursor.test.ts` (caso shape inválido `{x: 1}`) debe caer → restaurar.
- [ ] **S3** Cambiar el orden a `created_at ASC` (invertir) → `tests/integration/search/pagination.test.ts` debe caer (orden invertido) → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/utils/cursor.ts` y ramas de cursor en `queryBuilder.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
