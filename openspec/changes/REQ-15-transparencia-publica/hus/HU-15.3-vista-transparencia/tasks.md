# HU-15.3 — Vista pública /transparency con widgets

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.3-vista-transparencia`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/transparency.ts` con `getSummary(db, kv)` (cache-first), `computeSummary(db)` (puro, sin cache), `invalidateSummaryCache(kv)`, `formatClp(amount)` (helper "$45.000" mockup `mockups/transparency.html:49`).
- [ ] **T2** Validador `summaryResponseSchema` en `src/lib/validators/transparency.ts` (Zod).
- [ ] **T3** Endpoint `src/pages/api/v1/public/transparency/summary.ts` (GET, público):
  - Cache KV key `transparency:summary:v1` con TTL 300s.
  - Headers `Cache-Control: public, max-age=300, stale-while-revalidate=600`.
  - Sin `Set-Cookie`.
  - Forma `ExpenseRowPublic` (sin `document_r2_key` crudo, sólo `has_document: boolean`).
- [ ] **T4** Helper `formatClp` reusado en otros lugares (cards métricas, dashboard prestador, etc.).
- [ ] **T5** Componentes:
  - `src/components/transparency/Header.astro` — mockup `mockups/transparency.html:40-44`.
  - `src/components/transparency/SummaryCards.astro` — props `{ingresosMes, gastosFijos, fondoReserva}`. Mockup `mockups/transparency.html:46-59`.
  - `src/components/transparency/ExpensesTable.astro` — props `{items, ultimaActualizacion}`. Mockup `mockups/transparency.html:61-98`. Isla opcional para paginación por cursor.
  - `src/components/transparency/ExpenseRow.astro` — props `{item}`. Mockup `mockups/transparency.html:77-94`. Renderiza "Ver Boleta" si `has_document` o "Donación directa" si no.
  - `src/components/shared/PublicFooter.astro` — mockup `mockups/transparency.html:102-130`.
- [ ] **T6** Página `src/pages/transparency.astro` — SSR, sin sesión. Llama internamente al handler del endpoint, inyecta datos en componentes. Mockup base `mockups/transparency.html:28-130`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/services/transparency.test.ts` — `computeSummary` con fixtures; `formatClp` casos límite (0, millones, negativos); `invalidateSummaryCache` llama `kv.delete` con key esperada.
  - [ ] `tests/unit/validators/transparency.test.ts` — summaryResponseSchema rechaza `fondoReserva` no entero, fecha no string.
  - [ ] `tests/integration/transparency/summary.test.ts` — endpoint retorna headers cache correctos, payload sin email/nombre; KV hit/miss/SWR (segunda llamada <100ms con MISS previo).
  - [ ] `tests/e2e/transparency-view.spec.ts` — visitante anónimo carga `/transparency`, ve 3 tarjetas con números, ve tabla con al menos una fila, no hay header `Set-Cookie`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `getSummary`, omitir la lectura de KV y siempre ir a D1 → test integración con KV pre-poblado reporta MISS en vez de HIT → restaurar
- [ ] Sabotaje 2: exponer `document_r2_key` crudo en lugar de `has_document` → test integración que valida forma rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/transparency.ts`
- [ ] Type check verde
- [ ] Commit `feat: vista pública /transparency con widgets` y push