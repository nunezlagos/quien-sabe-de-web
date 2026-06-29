# Diseño técnico — HU-15.5 — Cron trigger día 5 del mes siguiente

**REQ padre:** REQ-15-transparencia-publica

## Modelo de datos

No introduce tablas. Usa `monthly_reports` (HU-15.1) y la idempotencia garantizada por su PK natural.

Estado auxiliar en KV:

- `reports:lock:<yyyy_mm>` (TTL 60 s) — flag que evita generación concurrente.
- `reports:lastRun:<yyyy_mm>` (TTL 30 días) — timestamp ISO de la última ejecución exitosa, leído por la GitHub Action para decidir si dispara o no.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/monthly-reports/cron-fallback` | POST | secret HMAC `X-Cron-Signature` | `{ yyyy_mm: "2026-05" }` | `200 { generated: true, yyyy_mm }` o `200 { generated: false, reason: "already-exists" }` | 401 firma inválida, 422 sin datos |

El endpoint manual `POST /api/v1/admin/monthly-reports/generate` (HU-15.4) sigue requiriendo sesión admin; el fallback de cron usa un endpoint dedicado autenticado por HMAC, separación que evita confundir trazas.

## Validaciones Zod

```ts
// src/lib/validators/reports.ts (pseudocódigo) — extiende HU-15.4
export const cronFallbackSchema = z.object({
  yyyy_mm: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
})

// Header validation
export const cronSignatureHeader = z.string().regex(/^v1=[a-f0-9]{64}$/)
```

## Componentes UI

No aplica. HU 100% infra/backend.

## Flujo de interacción (secuencial)

### Flujo A — Cloudflare Cron Trigger

1. Cloudflare invoca handler `scheduled` del Worker el día 5 a las 03:00 UTC.
2. Handler calcula `prevMonth = formatYyyyMm(scheduledTime - 1 mes)` en UTC.
3. Intenta adquirir lock KV `reports:lock:<prevMonth>` con TTL 60 s. Si ya existe, abandona (otro proceso está corriendo).
4. Llama `monthlyPdf.generate(env, prevMonth, { force: false })` de HU-15.4.
5. Si éxito → escribe `reports:lastRun:<prevMonth>` con timestamp. Si error `NoDataError` → log y termina sin lanzar.
6. Libera lock KV.

### Flujo B — GitHub Action fallback

1. Workflow `.github/workflows/monthly-report.yml` corre con cron `0 3 5 * *` (o diario si paranoia).
2. Step computa `prevMonth` y consulta `GET /api/v1/public/transparency/monthly/<prevMonth>`.
3. Si responde 200 → reporte ya existe, exit 0.
4. Si responde 404 → llama `POST /api/v1/admin/monthly-reports/cron-fallback` con body `{ yyyy_mm: prevMonth }` y header `X-Cron-Signature: v1=<HMAC>` calculado con `MONTHLY_REPORT_SECRET`.
5. Endpoint valida firma, llama el mismo servicio que el cron interno, responde.

## Capa de servicios

- `src/worker.ts` (o entrypoint Astro Cloudflare adapter) — exporta handler `scheduled(event, env, ctx)` que invoca:
- `src/lib/services/reports/cronRunner.ts` — métodos:
  - `runMonthlyCron(env, scheduledTime: Date): Promise<{ status: 'ok' | 'locked' | 'no-data', yyyy_mm: string }>`
  - `previousMonthUtc(now: Date): string` — helper puro testeable, retorna `"YYYY-MM"`.
  - `verifyHmacSignature(body: string, headerValue: string, secret: string): boolean` — validación constant-time.
- Reusa `monthlyPdf.generate` de HU-15.4 sin duplicar lógica de agregación.

## Configuración

- `wrangler.toml.example` añade:
  ```toml
  [triggers]
  crons = ["0 3 5 * *"]
  ```
- `.github/workflows/monthly-report.yml` — workflow nuevo con job que:
  - Trigger: `schedule: - cron: "0 3 5 * *"` y `workflow_dispatch`.
  - Steps: curl al endpoint public/admin con secret en `${{ secrets.MONTHLY_REPORT_SECRET }}`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/reports/cron.test.ts` | `previousMonthUtc` casos límite (1 enero, 31 diciembre, año bisiesto) |
| Unit | `tests/unit/services/reports/cron.test.ts` | `verifyHmacSignature` rechaza firmas inválidas y aceptan válidas |
| Integración | `tests/integration/reports/cron-handler.test.ts` | Invocar `scheduled` directamente: 3 escenarios Gherkin (genera, idempotente con lock, fallback workflow llama endpoint) |
| Integración | `tests/integration/reports/cron-handler.test.ts` | Endpoint `cron-fallback` retorna 401 sin firma, 200 con firma correcta |
| E2E | `tests/e2e/monthly-cron.spec.ts` (opcional) | Simular trigger con `wrangler dev --test-scheduled` |

## Dependencias y secuencia

- **Bloqueado por:** HU-15.4 (el cron es solo el disparador).
- **Bloquea a:** —
- **Recursos compartidos:** `wrangler.toml` (sección `[triggers]`), `src/worker.ts` o entrypoint Cloudflare, `.github/workflows/`.

## Riesgos técnicos

- Riesgo: `event.scheduledTime` no llega como `Date` sino timestamp ms → Mitigación: normalizar al inicio del handler con `new Date(event.scheduledTime)`.
- Riesgo: secret HMAC en repos públicos accidentalmente → Mitigación: validar en pre-commit hook que el secret no aparece literal en `wrangler.toml`; solo en `.env` y GitHub Secrets.
- Riesgo: lock KV no se libera por crash → Mitigación: TTL 60 s actúa como auto-release; idempotencia de HU-15.4 cubre re-corrida.
- Riesgo: handler `scheduled` no se ejecuta en `wrangler dev` sin flag → Mitigación: documentar uso de `--test-scheduled` en README de tests.
