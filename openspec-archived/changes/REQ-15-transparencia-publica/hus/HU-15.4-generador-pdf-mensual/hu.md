# HU-15.4 — Generador de PDF mensual desde Workers

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** sistema
**Quiero** generar el PDF del reporte mensual desde Workers
**Para** ofrecer descarga formal

## Criterios de aceptación (Gherkin)

### Escenario: Generación on-demand exitosa
  Cuando admin envía `POST /api/v1/admin/monthly-reports/generate` con `{"yyyy_mm":"2026-05"}`
  Entonces se crea fila en `monthly_reports` y se sube PDF a R2
  Y la respuesta incluye `pdf_url`

### Escenario: Re-generar mismo mes reemplaza
  Dado un reporte ya generado
  Cuando se vuelve a generar
  Entonces el PDF anterior es eliminado de R2 y reemplazado por el nuevo

### Escenario: Generar mes sin datos arroja 422
  Cuando se solicita un mes futuro o sin transacciones
  Entonces recibo 422 con `{ "error": "sin datos" }`

## Tareas técnicas

- [ ] Servicio `src/lib/services/reports/monthlyPdf.ts` que renderiza HTML → PDF (librería Workers-friendly)
- [ ] Endpoint `src/pages/api/v1/admin/monthly-reports/generate.ts`
- [ ] Upload a R2 bucket `reports`
- [ ] Tests `tests/integration/reports/monthly-pdf.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
