# HU-15.5 — Cron trigger día 5 del mes siguiente

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-15-transparencia-publica
**Rama:** `feat/HU-15.5-cron-mensual`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/reports/cronRunner.ts` con `runMonthlyCron(env, scheduledTime)`, `previousMonthUtc(now)` (helper puro), `verifyHmacSignature(body, headerValue, secret)` (constant-time).
- [ ] **T2** Validador `cronFallbackSchema` y header `cronSignatureHeader` en `src/lib/validators/reports.ts` (extiende HU-15.4).
- [ ] **T3** Handler `scheduled` en entrypoint (`src/worker.ts` o el que use el adapter Cloudflare de Astro):
  - Calcula `prevMonth = previousMonthUtc(new Date(event.scheduledTime))`.
  - Adquiere lock KV `reports:lock:<prevMonth>` con TTL 60s. Si ya existe → status `locked`, termina.
  - Llama `monthlyPdf.generate(env, prevMonth, { force: false })`.
  - Si éxito → escribe `reports:lastRun:<prevMonth>` con timestamp ISO. Si `NoDataError` → log + status `no-data`, sin lanzar.
  - Libera lock (delete key).
- [ ] **T4** Endpoint fallback `src/pages/api/v1/admin/monthly-reports/cron-fallback.ts` (POST, HMAC):
  - Valida `X-Cron-Signature` con `verifyHmacSignature`.
  - 401 si firma inválida.
  - Llama mismo servicio que el cron interno (DRY).
- [ ] **T5** Configuración `wrangler.toml.example`: añadir `[triggers] crons = ["0 3 5 * *"]`.
- [ ] **T6** Workflow `.github/workflows/monthly-report.yml`:
  - Trigger `schedule: cron: "0 3 5 * *"` + `workflow_dispatch`.
  - Step computa `prevMonth`, consulta `GET /api/v1/public/transparency/monthly/<prevMonth>`.
  - Si 200 → exit 0.
  - Si 404 → POST a `/api/v1/admin/monthly-reports/cron-fallback` con `X-Cron-Signature` calculado con `MONTHLY_REPORT_SECRET`.
- [ ] **T7** Documentar en README de tests el uso de `wrangler dev --test-scheduled` para verificar local.
- [ ] **T8** Tests:
  - [ ] `tests/unit/services/reports/cron.test.ts` — `previousMonthUtc` casos límite (1 enero, 31 diciembre, año bisiesto); `verifyHmacSignature` rechaza firmas inválidas y acepta válidas.
  - [ ] `tests/integration/reports/cron-handler.test.ts` — invocar `scheduled` directamente: genera, idempotente con lock, fallback workflow llama endpoint.
  - [ ] `tests/integration/reports/cron-handler.test.ts` — endpoint `cron-fallback` retorna 401 sin firma, 200 con firma correcta.
  - [ ] `tests/e2e/monthly-cron.spec.ts` (opcional) — `wrangler dev --test-scheduled` simula trigger.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `previousMonthUtc`, manejar mal el cambio de año (1 enero) → test unitario rojo → restaurar
- [ ] Sabotaje 2: en `verifyHmacSignature`, comparación no constant-time → test unitario con timing attack básico rojo → restaurar
- [ ] Sabotaje 3: omitir la adquisición de lock KV → dos crons concurrentes generan dos PDFs → test integración rojo (R2 tiene 2 objetos) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reports/cronRunner.ts`
- [ ] Type check verde
- [ ] Validar pre-commit: secret no aparece literal en `wrangler.toml`
- [ ] Commit `feat: cron mensual generación de reporte` y push