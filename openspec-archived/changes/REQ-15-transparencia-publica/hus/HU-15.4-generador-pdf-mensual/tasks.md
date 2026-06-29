# HU-15.4 — Generador de PDF mensual desde Workers

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.4-generador-pdf-mensual`

## Tareas técnicas

- [ ] **T1** Instalar `pdf-lib` (`bun add pdf-lib` o agregar a `package.json`) y commit en lockfile.
- [ ] **T2** Servicio `src/lib/services/reports/monthlyPdf.ts` con `generate(env, yyyyMm, opts)`, `renderPdfBytes(data)` (puro), `aggregateMonth(db, yyyyMm)`. Lanza `NoDataError` cuando agregados son 0/0 sin filas.
- [ ] **T3** Servicio `src/lib/services/reports/pdfTemplate.ts` — funciones puras con `pdf-lib` que dibujan encabezado, totales y tabla de gastos. Embebir fuente Nunito o normalizar a `StandardFonts.Helvetica`.
- [ ] **T4** Helper R2 `signGetUrl(env, key, ttlSec)` y `signPutUrl(env, key, ttlSec, contentType)` en `src/lib/utils/r2.ts` (centralizar; reusado por HU-15.6 y REQ-03).
- [ ] **T5** Validadores `generateReportSchema` y `monthParamSchema` en `src/lib/validators/reports.ts`.
- [ ] **T6** Endpoints:
  - `src/pages/api/v1/admin/monthly-reports/generate.ts` (POST, sesión admin). 409 si existe y `force!=true`. 422 si `NoDataError`.
  - `src/pages/api/v1/public/transparency/monthly/[yyyy-mm].ts` (GET, público) — 404 si no existe. Devuelve `pdf_url` firmada 1h.
- [ ] **T7** UPSERT en `monthly_reports` con PK natural `yyyy_mm`: si existe, DELETE objeto R2 anterior; luego UPDATE/INSERT.
- [ ] **T8** Tras éxito, invocar `invalidateSummaryCache` (HU-15.3).
- [ ] **T9** Componente `src/components/admin/MonthlyReportGenerator.astro` — selector de mes + botón submit + feedback toast. Mockup base `mockups/dashboard-admin.html:268-274`. Isla.
- [ ] **T10** Regla de validación: mes solicitado no puede ser el mes en curso ni futuro (en servicio, con mensaje claro).
- [ ] **T11** Lock KV `reports:lock:<yyyy_mm>` con TTL 60s al iniciar generación; liberar al terminar.
- [ ] **T12** Tests:
  - [ ] `tests/unit/services/reports/aggregate.test.ts` — `aggregateMonth` con fixtures (totales correctos, null para mes vacío).
  - [ ] `tests/unit/services/reports/pdf-render.test.ts` — `renderPdfBytes` produce buffer >0 con magic bytes `%PDF`.
  - [ ] `tests/unit/validators/reports.test.ts` — `generateReportSchema` rechaza mes fuera de regex; `monthParamSchema` idem.
  - [ ] `tests/integration/reports/monthly-pdf.test.ts` — 3 escenarios Gherkin: generación exitosa (R2 contiene objeto), re-generación reemplaza (R2 anterior eliminado), mes sin datos → 422. `GET /api/v1/public/transparency/monthly/2026-05` devuelve `pdf_url` con firma válida 1h.
  - [ ] `tests/e2e/admin-monthly-report.spec.ts` — admin selecciona mes → genera → descarga PDF.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `generate`, omitir DELETE del objeto R2 anterior al re-generar → test integración que verifica R2 tiene 1 objeto (no 2) → restaurar
- [ ] Sabotaje 2: en `aggregateMonth`, no retornar null cuando no hay datos → handler responde 200 con totales 0/0 en vez de 422 → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reports/monthlyPdf.ts`, `src/lib/services/reports/pdfTemplate.ts`
- [ ] Type check verde
- [ ] `bunx wrangler deploy --dry-run` → tamaño del bundle aceptable
- [ ] Commit `feat: generador PDF mensual` y push