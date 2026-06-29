# Propuesta — HU-25.1 — Endpoint /health con bindings y latencias

**Estado:** propuesta | **REQ padre:** REQ-25-healthcheck-uptime

## Contexto

El Worker de Cloudflare expone múltiples bindings (D1, KV, R2) cuya salud no es observable desde fuera. Sin un endpoint de health, los operadores no pueden detectar caídas tempranas ni configurar alertas. Esta HU implementa `GET /api/v1/health` que prueba cada binding con `checkBinding(name, fn, timeoutMs)`, mide latencia con `performance.now()`, reporta estado global `ok | degraded | down` y HTTP status 200 en cualquier caso (excepto down total con código 503 opcional). Es la base para HU-25.3 (UptimeRobot).

## Mockups de referencia

No aplica (HU backend sin UI).

## Alternativas consideradas

### Opción A — Health endpoint con probes paralelos y timeout individual
- Promise.all con `Promise.race` para timeouts de 1s por binding.
- Probes: D1 `SELECT 1`, KV `get('health-probe')`, R2 `head('health.txt')`, SES no-op (cliente init).
- Pro: response time < 200ms p95 con probes en paralelo.
- Pro: un binding caído no cuelga el endpoint completo.
- Contra: requiere implementar timeouts manualmente con `AbortController`.

### Opción B — Health endpoint simple con try/catch sin timeouts
- Pro: trivial.
- Contra: un binding lento cuelga el endpoint; UptimeRobot recibe timeout y marca caída falsa.

### Opción C — Health endpoint que devuelve sólo estado de memoria del Worker
- Pro: instantáneo.
- Contra: no detecta caída de bindings, que es lo que realmente importa.

## Decisión

Se elige **Opción A**. Cada binding tiene su probe con timeout individual de 1s; todos corren en paralelo; el reporte agrega estado global. Esto es lo que UptimeRobot espera para alertas precisas.

## Riesgos y mitigaciones

- Riesgo: R2 `head('health.txt')` requiere que el objeto exista → Mitigación: hacer upload del archivo en bootstrap (script de seed) o usar `list({ limit: 1 })` que es read-only.
- Riesgo: SES no tiene operación trivial; instanciar el cliente es el probe → Mitigación: `new SESClient({ region: 'us-east-1' })` no hace I/O; suficiente como probe.
- Riesgo: el endpoint queda público y expone información de topología → Mitigación: no incluir nombres sensibles; sólo los nombres canónicos (`d1`, `kv`, `r2`, `ses`) y `status`/`latency_ms`.

## Métrica de éxito

- GET con todos los bindings OK → 200 con `status:"ok"` y cada componente con `latency_ms < 100`.
- GET con D1 timeout (> 1s) → 200 con `status:"degraded"` y `d1.status:"timeout"`.
- p95 < 200ms en 100 requests consecutivos.
- Sabotaje: comentar el `Promise.race` del timeout → D1 lento cuelga el endpoint 5s → E2E con timeout simulado verifica que responde en < 1.5s → restaurar.