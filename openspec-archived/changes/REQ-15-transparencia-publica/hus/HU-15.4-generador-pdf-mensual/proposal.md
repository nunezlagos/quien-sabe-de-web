# Propuesta — HU-15.4 — Generador de PDF mensual desde Workers

**Estado:** propuesta | **REQ padre:** REQ-15-transparencia-publica

## Contexto

El compromiso de transparencia (OE3) incluye entregar un reporte mensual descargable en formato PDF, firmado en R2, que sirva como artefacto contable inmutable. Esta HU implementa la generación on-demand del PDF y su persistencia, alimentando el endpoint `GET /api/v1/public/transparency/monthly/:yyyy-mm` y disparable manualmente por admin antes de que el cron lo haga (HU-15.5).

## Mockups de referencia

- No existe un mockup específico para el PDF generado; el PDF se diseña siguiendo la estética de `mockups/transparency.html:46-97` (tarjetas + tabla histórico). UI a diseñar siguiendo este estilo.
- `mockups/dashboard-admin.html:268-274` — sección Finanzas donde aparecerá el botón "Generar reporte mensual". UI a diseñar siguiendo este estilo.

## Alternativas consideradas

### Opción A — HTML → PDF con librería Workers-friendly (`@cloudflare/pdf` / `pdf-lib`)
- Render HTML template (Astro o string) → conversión a PDF dentro del Worker.
- Pro: 100% serverless, sin servicios externos; PDF generado en la misma región que D1/R2; coste cero adicional.
- Contra: limites de CPU/memoria de Workers (50 ms gratis / 30 s pagado); PDFs ricos con imágenes pueden no caber.

### Opción B — Delegar a servicio externo (Browserless, Gotenberg, CloudConvert)
- Worker llama API HTTP que devuelve el PDF.
- Pro: PDFs complejos con fidelidad CSS perfecta.
- Contra: dependencia externa, costo recurrente, latencia de red, secretos adicionales que gestionar.

### Opción C — Generar SVG/PNG y embeber en PDF mínimo
- Reporte sin layout rico, una sola página con texto plano.
- Pro: muy barato.
- Contra: aspecto poco profesional, contradice la intención del mockup `transparency.html`.

## Decisión

Se elige Opción A con `pdf-lib` (puro JS, compatible con Workers). El reporte mensual es estructuralmente simple (3 totales + tabla de gastos del mes), no requiere render CSS complejo. Mantenemos toda la infraestructura dentro de Cloudflare, sin secretos externos. Si en el futuro se quiere fidelidad pixel-perfect, migrar a Opción B sin romper el contrato del endpoint.

## Riesgos y mitigaciones

- Riesgo: timeout de Worker en generación con muchos gastos → Mitigación: limitar PDF a 1 página por mes con tabla resumida; gastos completos se ven en `/transparency`.
- Riesgo: tamaño del PDF excede límites de R2 PUT en una sola request → Mitigación: PDFs esperables < 100 KB; usar multipart solo si supera 5 MB (no se anticipa).
- Riesgo: regenerar un mes mientras el cron lo está generando produce duplicados → Mitigación: PK natural `yyyy_mm` en `monthly_reports` + UPSERT idempotente.
- Riesgo: PDF anterior huérfano en R2 al regenerar → Mitigación: el endpoint borra el `pdfR2Key` previo antes de subir el nuevo (transacción lógica).

## Métrica de éxito

- Admin invoca `POST /api/v1/admin/monthly-reports/generate` con `{"yyyy_mm":"2026-05"}` y recibe `{ pdf_url }` en menos de 5 s.
- El PDF descargado contiene los 3 totales y la lista de gastos del mes.
- Re-invocar el endpoint para el mismo mes reemplaza el PDF en R2 sin duplicar filas en `monthly_reports`.
- Solicitar un mes futuro retorna 422 con `{ "error": "sin datos" }`.
