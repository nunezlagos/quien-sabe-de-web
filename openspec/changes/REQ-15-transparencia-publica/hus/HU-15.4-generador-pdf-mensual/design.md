# Diseño técnico — HU-15.4 — Generador de PDF mensual desde Workers

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

Reutiliza `expenses`, `monthly_reports` (HU-15.1) y `donations` (REQ-14). No introduce nuevas tablas.

Operaciones sobre `monthly_reports`:

- UPSERT por PK `yyyy_mm`: si existe, primero `DELETE` del objeto R2 referenciado por `pdf_r2_key` anterior, luego `UPDATE`; si no, `INSERT`.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/monthly-reports/generate` | POST | sesión admin | `{ yyyy_mm: "2026-05", force?: boolean }` | `200 { yyyy_mm, donations_total, expenses_total, ratio, pdf_url, generated_at }` | 400 validación, 401, 403, 409 si existe y `force!=true`, 422 mes sin datos |
| `/api/v1/public/transparency/monthly/:yyyy-mm` | GET | público | — | `200 { yyyy_mm, donations_total, expenses_total, ratio, pdf_url }` (pdf_url firmada 1 h) | 404 si no existe |

## Validaciones Zod

```ts
// src/lib/validators/reports.ts (pseudocódigo)
export const generateReportSchema = z.object({
  yyyy_mm: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  force: z.boolean().optional().default(false),
})

export const monthParamSchema = z.object({
  yyyy_mm: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
})
```

Regla adicional: el mes solicitado no puede ser el mes en curso ni futuro (validado en servicio, no en Zod, para dar mensaje de error claro).

## Componentes UI

### Páginas Astro

- `src/pages/admin/index.astro` (existente) — sección Finanzas (HU-15.2) recibe botón adicional "Generar reporte mensual" y selector de mes.

### Componentes Astro reutilizables

- `src/components/admin/MonthlyReportGenerator.astro` — props: ninguna.
  - Mockup base: `mockups/dashboard-admin.html:268-274` (placeholder Finanzas); UI a diseñar siguiendo este estilo.
  - Islas requeridas: sí — selector de mes + botón submit + feedback toast.

El PDF generado en sí no es un componente Astro sino un buffer producido en el servidor; su layout interno se diseña en el servicio.

## Flujo de interacción (secuencial)

1. Admin selecciona mes "2026-05" en `MonthlyReportGenerator` y pulsa "Generar".
2. Isla envía `POST /api/v1/admin/monthly-reports/generate { yyyy_mm: "2026-05" }`.
3. Servidor: middleware admin → valida con `generateReportSchema`.
4. Servicio `monthlyPdf.generate("2026-05")`:
   - SELECT agregados de `donations` y `expenses` para ese mes.
   - Si totales son 0/0 y no hay filas → throw `NoDataError` → handler responde 422.
   - Construye PDF con `pdf-lib`: encabezado, 3 totales, tabla de gastos del mes.
   - PUT a R2 bucket `reports` con key `monthly/2026-05.pdf` (Content-Type `application/pdf`).
   - Si existía registro previo: DELETE objeto R2 anterior.
   - UPSERT en `monthly_reports` con los totales calculados y `pdf_r2_key`.
   - Retorna metadata + URL firmada 1 h via helper R2 (`signGetUrl`).
5. Isla recibe respuesta, muestra toast "Reporte 2026-05 generado" con enlace de descarga.
6. Invalida cache KV de `/transparency` (delegado al servicio).

## Capa de servicios

- `src/lib/services/reports/monthlyPdf.ts` — métodos:
  - `generate(env, yyyyMm, opts: { force?: boolean }): Promise<MonthlyReport & { pdf_url: string }>`
  - `renderPdfBytes(data: MonthlyReportData): Promise<Uint8Array>` — render puro testeable.
  - `aggregateMonth(db, yyyyMm): Promise<MonthlyReportData | null>` — null si sin datos.
- `src/lib/services/reports/pdfTemplate.ts` — funciones puras que dibujan secciones del PDF (encabezado, totales, tabla) con `pdf-lib`.
- Reusa `signGetUrl` del helper R2 (REQ-03 según `hu.md` de HU-15.6).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/reports/aggregate.test.ts` | `aggregateMonth` con fixtures: totales correctos, retorna null para mes vacío |
| Unit | `tests/unit/services/reports/pdf-render.test.ts` | `renderPdfBytes` produce buffer >0 y abre como PDF válido (magic bytes `%PDF`) |
| Integración | `tests/integration/reports/monthly-pdf.test.ts` | 3 escenarios Gherkin: generación exitosa (201/200 + R2 contiene objeto), re-generación reemplaza (R2 anterior eliminado), mes sin datos → 422 |
| Integración | `tests/integration/reports/monthly-pdf.test.ts` | `GET /api/v1/public/transparency/monthly/2026-05` devuelve `pdf_url` con firma válida 1 h |
| E2E | `tests/e2e/admin-monthly-report.spec.ts` | Admin loguea → selecciona mes → genera → descarga PDF |

## Dependencias y secuencia

- **Bloqueado por:** HU-15.1, HU-15.2, REQ-14 (donations), REQ-03 (helper `signGetUrl` para R2 firmado).
- **Bloquea a:** HU-15.5 (cron usa este servicio).
- **Recursos compartidos:** bucket R2 `reports`, helper `signGetUrl`.

## Riesgos técnicos

- Riesgo: `pdf-lib` añade >50 KB al bundle del Worker → Mitigación: aceptable; verificar tamaño con `bunx wrangler deploy --dry-run`. Si excede límite, evaluar Opción B del proposal.
- Riesgo: caracteres con tilde no renderizan por defecto → Mitigación: embeber fuente Nunito (la del mockup) o usar `StandardFonts.Helvetica` con normalización Unicode.
- Riesgo: clock skew entre Worker y D1 produce ratio incorrecto en cierre de mes → Mitigación: usar `paid_at` y `donation.created_at` como verdad, no `Date.now()`.
- Riesgo: condición de carrera entre admin manual y cron simultáneo → Mitigación: UPSERT idempotente + bloqueo lógico via flag en KV (`reports:lock:2026-05`) con TTL 60 s.
