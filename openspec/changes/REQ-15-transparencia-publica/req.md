# REQ-15-transparencia-publica

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE3

## Descripción

Página pública `/transparency` con ingresos (donaciones agregadas), gastos
(infraestructura, dominios, etc.), enlaces a boletas/facturas (R2) y un
reporte mensual auto-generado descargable en PDF. Materializa el compromiso
de "transparencia radical" definido en `docs/avance-1/03-fundamentacion-del-proyecto.md`.

## Criterios de éxito

- [ ] `/transparency` accesible sin auth.
- [ ] Donaciones agregadas por mes (sin PII de donantes).
- [ ] Gastos detallados (proveedor, monto, fecha, doc adjunto).
- [ ] Reporte mensual auto-generado el día 5 del mes siguiente.
- [ ] Descarga de reporte mensual en formato PDF.

## Superficie técnica

### Endpoints API
- `GET /api/v1/public/transparency/summary` — resumen agregado [público]
- `GET /api/v1/public/transparency/monthly/:yyyy-mm` — reporte específico [público]
- `POST   /api/v1/admin/expenses` — registrar gasto [admin]
- `PATCH  /api/v1/admin/expenses/:id` — editar [admin]
- `DELETE /api/v1/admin/expenses/:id` — eliminar [admin]
- `POST   /api/v1/admin/expenses/:id/document` — genera presigned PUT para comprobante (boleta/factura) en R2 [admin]
- `POST   /api/v1/admin/monthly-reports/generate` — disparo manual [admin]

### Vistas Astro
- `/transparency` — vista pública

### Tablas Drizzle
- `expenses` (id, provider, amount_clp, paid_at, document_r2_key?, note)
- `monthly_reports` (yyyy_mm, donations_total, expenses_total, ratio, pdf_r2_key, generated_at)

### Bindings Cloudflare
- `D1`, `R2` (PDFs reportes + boletas), `CRON` (cron trigger día 5)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-15.1 | schema-expenses-reports | Tablas + migración | P0 |
| HU-15.2 | crud-expenses-admin | CRUD gastos | P0 |
| HU-15.3 | vista-transparencia | Página pública con widgets | P0 |
| HU-15.4 | generador-pdf-mensual | Render PDF en Worker (HTML → PDF) | P1 |
| HU-15.5 | cron-mensual | Trigger día 5 mes siguiente | P1 |
| HU-15.6 | boletas-en-r2 | Upload + link público firmado | P1 |

## Tests requeridos

- **Unit:** cálculo del ratio, formateador CLP, validador Zod expense.
- **Integración:** generación de reporte para un mes con fixtures, idempotencia (re-generar no duplica), public endpoint cacheable.
- **E2E:** admin crea gasto + admin dispara reporte manual → visitante anónimo accede a `/transparency` y descarga PDF.

## Dependencias

- **Depende de:** REQ-13, REQ-14
- **Habilita a:** —

## Riesgos / suposiciones

- Generación PDF en Workers limitada en tamaño/memoria: usar HTML simple + librería minimalista.
- Cron triggers son Workers feature pago: alternativa GitHub Action diaria gratuita.
