# HU-23.3 — Reorder y eliminar fotos del portfolio

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-23-portfolio-prestador
**Rama:** `feat/HU-23.3-reorder-eliminar-fotos`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/portfolio/reorder.ts` con `reorderPortfolio(db, providerId, orderedIds)` usando doble pasada:
  - 1ª pasada: `UPDATE portfolio_images SET sort_order = sort_order + 100 WHERE id IN (...)` (evita colisión con UNIQUE).
  - 2ª pasada: `UPDATE portfolio_images SET sort_order = <index> WHERE id = ?` para cada id en orden.
  - Usar `db.batch([...])` para encadenar updates en una sola roundtrip.
- [ ] **T2** Servicio `src/lib/services/portfolio/delete.ts` con `deletePortfolioImage(db, bucket, providerId, imageId)`:
  - Verifica ownership (id pertenece al provider).
  - `bucket.delete(r2Key)`.
  - `DELETE` fila D1.
  - `compactSortOrder` (HU-23.1).
- [ ] **T3** Validadores `reorderPortfolioSchema` (order ≤ 5 ids, refine unique) y `imageIdParamSchema` (coerce number positive) en `src/lib/validators/portfolio.ts`.
- [ ] **T4] Endpoints:
  - `src/pages/api/v1/providers/me/portfolio/reorder.ts` (PATCH, sesión prestador). 422 si largo del array no coincide con count actual del prestador.
  - `src/pages/api/v1/providers/me/portfolio/[id].ts` (DELETE, sesión prestador). 403 si id pertenece a otro provider.
- [ ] **T5** Cliente `src/lib/client/portfolio.ts` con `deletePortfolioImage(id)`, `reorderPortfolio(orderedIds)`, `uploadPortfolioImage(file)`. Manejo de errores con tipos para que la isla renderice mensajes específicos.
- [ ] **T6] Tests:
  - [ ] `tests/unit/portfolio/reorder.test.ts` — estrategia doble pasada no rompe UNIQUE (simular concurrencia con batch).
  - [ ] `tests/integration/portfolio/reorder-delete.test.ts` — DELETE elimina objeto R2 y compacta; reorder con `[42,12,33]` deja 0,1,2; 403 al tocar imagen ajena; 422 al reorder con largo incorrecto.
  - [ ] `tests/e2e/dashboard-portfolio.spec.ts` (extender) — clic en delete quita card del grid sin recarga.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `reorderPortfolio`, omitir la 1ª pasada +100 → UNIQUE colisiona al asignar nuevos `sort_order`, test integración rojo → restaurar
- [ ] Sabotaje 2: en `deletePortfolioImage`, no borrar el objeto R2 antes de D1 → objeto huérfano, test integración con R2 mockeado rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/portfolio/reorder.ts`, `src/lib/services/portfolio/delete.ts`
- [ ] Type check verde
- [ ] Commit `feat: reorder + delete portfolio` y push