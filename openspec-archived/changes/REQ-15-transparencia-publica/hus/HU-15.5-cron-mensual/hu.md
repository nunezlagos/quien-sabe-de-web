# HU-15.5 — Cron trigger día 5 del mes siguiente

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-15-transparencia-publica

## Historia de usuario

**Como** sistema
**Quiero** generar automáticamente el reporte mensual el día 5
**Para** no depender de gatillo manual

## Criterios de aceptación (Gherkin)

### Escenario: Cron dispara generación
  Cuando el cron trigger Workers se ejecuta el día 5 a las 03:00 UTC
  Entonces se invoca `monthlyPdf.generate(<mes anterior>)`
  Y queda fila nueva en `monthly_reports`

### Escenario: Cron idempotente
  Dado el reporte de ese mes ya existe
  Cuando el cron corre
  Entonces no se duplica, sólo reemplaza si flag `force=false` está activo

### Escenario: Fallback GitHub Action si plan gratuito
  Dado entorno sin cron triggers
  Cuando se ejecuta el script `.github/workflows/monthly-report.yml`
  Entonces invoca el endpoint admin con secret

## Tareas técnicas

- [ ] Sección `[triggers]` en `wrangler.toml.example` con cron `0 3 5 * *`
- [ ] Handler `scheduled` en `src/worker.ts` o entrypoint Astro Cloudflare
- [ ] Workflow `.github/workflows/monthly-report.yml` como fallback
- [ ] Tests `tests/integration/reports/cron-handler.test.ts` invocando handler directamente

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
