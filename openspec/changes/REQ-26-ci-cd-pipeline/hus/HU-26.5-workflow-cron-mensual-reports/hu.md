# HU-26.5 — Cron mensual fallback de reportes

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-26-ci-cd-pipeline

## Historia de usuario

**Como** equipo
**Quiero** un cron mensual en GitHub Actions como backup del cron Cloudflare
**Para** garantizar generación de reportes (REQ-15) aún si CF falla

## Criterios de aceptación (Gherkin)

### Escenario: Cron corre día 1 cada mes
  Cuando llega el día 1 a las 03:00 UTC
  Entonces el workflow se dispara y consume `POST /api/v1/admin/reports/monthly?key=<secret>`

### Escenario: Idempotente con cron CF
  Cuando ambos crons corren
  Entonces el segundo detecta que el reporte ya existe y responde 200 sin regenerar

### Escenario: Falla envía alerta
  Cuando el endpoint devuelve 5xx
  Entonces el workflow falla y notifica Discord

### Escenario: Generación accesible en /transparency
  Cuando se completa
  Entonces el reporte aparece en `/transparency` (REQ-15)

## Tareas técnicas

- [ ] Archivo `.github/workflows/cron-reports.yml` con `on: schedule: cron: '0 3 1 * *'`
- [ ] Llamar endpoint protegido del REQ-15 con secret de header `X-Cron-Key`
- [ ] Tests: ejecutar manualmente vía `workflow_dispatch` para validar

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
