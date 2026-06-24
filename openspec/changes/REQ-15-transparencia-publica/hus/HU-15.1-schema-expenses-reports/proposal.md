# Propuesta — HU-15.1 — Schema expenses + monthly_reports

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

Se requiere persistir gastos operacionales (dominio, hosting, etc.) y reportes mensuales agregados para alimentar la vista pública `/transparency`. Sin estas tablas no hay base de verdad para los widgets ni el PDF descargable, comprometiendo el objetivo OE3 de transparencia radical de la plataforma.

## Mockups de referencia

- `mockups/transparency.html:46-59` — tarjetas con totales (ingresos, gastos, fondo reserva) que se calculan agregando `expenses` y `monthly_reports`.
- `mockups/transparency.html:66-97` — tabla "Historial de Gastos" con columnas Fecha, Concepto, Monto, Comprobante; mapea directamente a campos de `expenses`.

## Alternativas consideradas

### Opción A — Dos tablas separadas (`expenses` + `monthly_reports`)
- Tabla `expenses` con detalle fila por fila y tabla `monthly_reports` con agregados pre-calculados por mes.
- Pro: lectura pública barata (un solo SELECT al reporte). Generación cron desacoplada del cálculo en runtime.
- Contra: requiere mantener consistencia entre detalle y agregado; necesita job de reconciliación si se edita un gasto histórico.

### Opción B — Tabla única `expenses` agregando en runtime
- Solo `expenses`; los totales por mes se calculan en cada `GET /transparency` con `SUM() GROUP BY`.
- Pro: una sola fuente de verdad, sin riesgo de divergencia.
- Contra: cada visita anónima ejecuta agregación; no hay snapshot histórico inmutable para el PDF firmado, dificultando auditoría posterior.

## Decisión

Se elige Opción A. El reporte mensual es un artefacto contable: requiere ser un snapshot inmutable congelado el día 5 del mes siguiente, asociado a un PDF en R2. Mantener `monthly_reports` como tabla separada permite que el PDF y el JSON agregado siempre coincidan aunque se editen gastos posteriormente (con auditoría visible).

## Riesgos y mitigaciones

- Riesgo: divergencia entre `expenses` (detalle) y `monthly_reports.expenses_total` (agregado) si se edita un gasto pasado → Mitigación: regenerar reporte del mes afectado vía endpoint admin (HU-15.4) marcando el cambio en `monthly_reports.generated_at`.
- Riesgo: `amount_clp` aceptando cero o negativos contamina ratios → Mitigación: CHECK constraint `amount_clp > 0` directo en migración.
- Riesgo: pérdida del vínculo gasto ↔ documento si se elimina la fila → Mitigación: política de DELETE controlada vía endpoint admin (HU-15.2) que primero invalida `document_r2_key`.

## Métrica de éxito

- `bunx drizzle-kit migrate` aplica la migración sin errores en D1 local.
- Test de integración (HU descrita) confirma que insertar `amount_clp=0` falla por CHECK.
- `SELECT name FROM sqlite_master WHERE type='table'` lista `expenses` y `monthly_reports`.
