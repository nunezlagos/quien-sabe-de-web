# HU-06.4 — Autocompletado de oficios y comunas

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-06-buscador-discovery
**Rama:** `feat/HU-06.4-autocomplete`

## Tareas tecnicas

- [ ] **T1** Crear migración `0006_autocomplete_normalized.sql` con columnas `slug_normalized` + índices en `trades` y `communes`. Aplicar con `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T2** Helper `normalizeAccents(s)` en `src/lib/utils/text.ts` — NFD + remove diacritics + lowercase. Idempotente.
- [ ] **T3** Schema Zod `autocompleteParamsSchema` en `src/lib/validators/autocomplete.ts`.
- [ ] **T4** Servicio `autocompleteTrades` y `autocompleteCommunes` en `src/lib/services/search/autocomplete.ts` usando `slug_normalized LIKE ? || '%' OR lower(name) LIKE ? || '%'`.
- [ ] **T5** Endpoint `src/pages/api/v1/search/autocomplete.ts` con GET. Zod-valida, normaliza `q`, llama al servicio según `kind`, devuelve con `Cache-Control: public, max-age=60`.
- [ ] **T6** Componente `src/components/search/AutocompleteInput.astro` con debounce 150 ms y soporte teclado (a11y).
- [ ] **T7** Tests:
  - [ ] `tests/unit/utils/text.test.ts` — `normalizeAccents` cases; idempotente.
  - [ ] `tests/unit/validators/autocomplete.test.ts` — Zod rechaza inválidos.
  - [ ] `tests/integration/search/autocomplete.test.ts` — fixtures: trades + communes. Cada caso del criterio de aceptación.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar el threshold mínimo a `q.length < 1` → `tests/integration/search/autocomplete.test.ts` (caso `q=a`) debe pasar a 200 con resultados → restaurar.
- [ ] **S2** Quitar la normalización de acentos en el server (usar `q` raw) → `tests/integration/search/autocomplete.test.ts` (caso `q=ñu`) debe caer → restaurar.
- [ ] **S3** Quitar el `Cache-Control: public, max-age=60` del response → agregar aserción en test que verifique el header → debe caer → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/utils/text.ts` y `src/lib/services/search/autocomplete.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
