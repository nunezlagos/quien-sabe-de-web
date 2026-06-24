# Propuesta — HU-15.5 — Cron trigger día 5 del mes siguiente

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

Sin automatización, el reporte mensual depende de que un admin recuerde dispararlo. Para cumplir el criterio "Reporte mensual auto-generado el día 5 del mes siguiente" del `req.md:19`, esta HU encadena el generador (HU-15.4) a un trigger Cloudflare Cron, con fallback GitHub Action para entornos sin plan pago.

## Mockups de referencia

No aplica. HU 100% infraestructura/backend sin UI dedicada. La visibilidad para admin se ofrece reusando los logs y la confirmación de HU-15.4.

## Alternativas consideradas

### Opción A — Cron Trigger Workers (`0 3 5 * *`) con fallback GitHub Action
- Handler `scheduled` en el worker que invoca `monthlyPdf.generate(prevMonth)` el día 5 a las 03:00 UTC. Workflow GitHub Action `monthly-report.yml` corre diariamente y hace `POST` al endpoint admin si detecta que el reporte aún no existe.
- Pro: redundancia gratis; el cron puro es nativo Cloudflare; GitHub Action cubre plan free Cloudflare.
- Contra: dos caminos a mantener.

### Opción B — Solo Cron Trigger Workers
- Único origen. Sin fallback.
- Pro: simpler.
- Contra: Cron Triggers requieren plan pago Workers; el proyecto en dev/staging puede no tenerlo (`req.md:67` advertencia).

### Opción C — Solo GitHub Action programada
- Cron lo gestiona GitHub Actions y dispara endpoint admin con secret.
- Pro: gratis siempre.
- Contra: depende de GitHub disponibilidad; secret circulando; latencia variable.

## Decisión

Se elige Opción A. El `req.md:66-67` explícitamente menciona el fallback GitHub Action como mitigación al riesgo del plan pago. Mantener ambos paths cubre dev (free) y prod (paid) con la misma lógica de negocio idempotente en HU-15.4.

## Riesgos y mitigaciones

- Riesgo: cron corre dos veces (Cloudflare reintento + GitHub Action) → Mitigación: HU-15.4 es idempotente vía PK `yyyy_mm` y UPSERT; flag KV `reports:lock:<yyyy_mm>` evita generación concurrente real.
- Riesgo: secret del fallback GitHub Action filtrado → Mitigación: `MONTHLY_REPORT_SECRET` como GitHub Actions secret + validación HMAC en el endpoint admin; rotación documentada.
- Riesgo: zona horaria mal configurada genera reporte del mes equivocado → Mitigación: el handler `scheduled` recibe `event.scheduledTime` UTC; cálculo de `prevMonth` se hace en UTC explícitamente.
- Riesgo: cron silenciosamente falla y nadie se entera → Mitigación: log estructurado + alerta a admin (KV flag visible en dashboard) si pasa el día 7 sin reporte del mes anterior.

## Métrica de éxito

- El día 5 de cualquier mes, a las 03:00 UTC, aparece una fila nueva en `monthly_reports` sin intervención humana, en entorno prod (con plan pago).
- En entorno sin plan pago, el workflow `.github/workflows/monthly-report.yml` corre, detecta ausencia y dispara el endpoint admin con secret válido, produciendo el mismo resultado.
- Re-ejecuciones del cron en el mismo día no duplican filas (idempotencia confirmada por test).
