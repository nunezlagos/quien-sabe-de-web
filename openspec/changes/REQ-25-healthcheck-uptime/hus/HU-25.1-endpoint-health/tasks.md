# HU-25.1 — Endpoint /health con bindings y latencias

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-25-healthcheck-uptime
**Rama:** `feat/HU-25.1-endpoint-health`

## Tareas técnicas

- [ ] **T1** Helper `checkBinding<T>(name, fn, timeoutMs)` en `src/lib/services/health/check.ts` con `AbortController` + `Promise.race`. Retorna `{status: 'ok'|'down'|'timeout', latency_ms: number, error?: string}`.
- [ ] **T2] Probes individuales en `src/lib/services/health/probes.ts`:
  - `probeD1(env)` — `await env.DB.prepare('SELECT 1 AS ok').first()`.
  - `probeKV(env)` — `await env.SESSION.get('health-probe')`.
  - `probeR2(env)` — `await env.BUCKET.head('health.txt')`.
  - `probeSES()` — `new SESClient({ region: 'us-east-1' })`.
- [ ] **T3** Función `runHealthChecks(env)` que ejecuta los 4 probes en paralelo con `Promise.all`. Mide `performance.now()` antes/después de cada uno. Calcula `status` global.
- [ ] **T4] Endpoint `src/pages/api/v1/health.ts` (GET, público):
  - Llama `runHealthChecks(env)`.
  - Header `Cache-Control: no-store`.
  - Responde 200 si status `ok` o `degraded`; 503 si `down`.
  - JSON con shape `HealthResponse`.
- [ ] **T5** Bootstrap script `scripts/seed-r2-health.ts` que crea `health.txt` vacío en R2 (idempotente). Documentar en README cómo ejecutarlo tras deploy inicial.
- [ ] **T6** Tests:
  - [ ] `tests/unit/services/health-check.test.ts` — `checkBinding('d1', async () => 1, 100)` → `{status:'ok', latency_ms:<100}`; con fn que rechaza → `{status:'down'}`; con fn que tarda 200ms con timeout 100 → `{status:'timeout'}`.
  - [ ] `tests/integration/health/health.test.ts` (con miniflare) — GET con todos los bindings OK devuelve 200 + `status:'ok'` + cada componente con latency < 100ms; con D1 mock rechazado devuelve 200 + `status:'degraded'` + d1.status='down'; con todos mock rechazados devuelve 503 + `status:'down'`; verificar header `Cache-Control: no-store`.
  - [ ] Sabotaje 1: en `checkBinding`, olvidar el `Promise.race` con timeout → D1 mock que tarda 2s cuelga el endpoint → test verifica que la respuesta retorna en < 1.5s (con timeout 1000ms) → restaurar.
  - [ ] Sabotaje 2: en `runHealthChecks`, ejecutar los 4 probes secuencialmente (`await probeD1; await probeKV; await probeR2; await probeSES`) en vez de `Promise.all` → tiempo total = suma de latencias → test verifica que el endpoint retorna en < 200ms (con cada probe ~10ms) → restaurar.
  - [ ] Sabotaje 3: en el endpoint, olvidar el header `Cache-Control: no-store` → UptimeRobot cachea el resultado por 60s y no detecta caída real → test verifica que el header está presente → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Test E2E manual en staging con `curl` documentado en `docs/runbook.md`
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/health/`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint /health con bindings y latencias` y push a rama (no merge a main)