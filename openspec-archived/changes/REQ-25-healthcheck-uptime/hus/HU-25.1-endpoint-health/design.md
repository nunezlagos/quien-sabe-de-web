# Diseño técnico — HU-25.1 — Endpoint /health con bindings y latencias

**REQ padre:** REQ-25-healthcheck-uptime

## Modelo de datos

No aplica. Endpoint de lectura sin DDL.

## Contrato de API

| Endpoint | Método | Auth | Response 200 | Response 503 | Cache |
|---|---|---|---|---|---|
| `/api/v1/health` | GET | público | `{ status: "ok" \| "degraded", components: {...} }` | `{ status: "down", components: {...} }` (sólo si TODOS los componentes caen) | `Cache-Control: no-store` |

Shape del response:
```ts
interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string  // ISO
  components: {
    d1: { status: 'ok' | 'down' | 'timeout', latency_ms: number }
    kv: { status: 'ok' | 'down' | 'timeout', latency_ms: number }
    r2: { status: 'ok' | 'down' | 'timeout', latency_ms: number }
    ses: { status: 'ok' | 'down' | 'timeout', latency_ms: number }
  }
}
```

Status global:
- `ok`: todos los componentes `ok`.
- `degraded`: al menos uno `down` o `timeout`, pero al menos uno `ok`.
- `down`: todos `down` o `timeout`.

## Validaciones Zod

```ts
// src/lib/validators/health.ts
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  timestamp: z.string().datetime(),
  components: z.object({
    d1: componentSchema,
    kv: componentSchema,
    r2: componentSchema,
    ses: componentSchema,
  }),
})
const componentSchema = z.object({
  status: z.enum(['ok', 'down', 'timeout']),
  latency_ms: z.number().nonnegative(),
})
```

(Usado en tests para validar el shape.)

## Componentes UI

No aplica. Backend puro.

## Flujo de interacción (secuencial)

1. Monitoreo externo (HU-25.3) hace `GET /api/v1/health`.
2. Handler invoca `runHealthChecks(env)` que ejecuta 4 probes en paralelo con `Promise.all` y `Promise.race` para timeouts de 1000ms.
3. Agrega resultados en `HealthResponse` con cálculo de status global.
4. Status HTTP: `200` si `ok` o `degraded`; `503` si `down`.
5. Headers: `Cache-Control: no-store` (no cachear el resultado).

## Capa de servicios

`src/lib/services/health/check.ts`:
- `checkBinding<T>(name: string, fn: () => Promise<T>, timeoutMs: number): Promise<ComponentResult>` — usa `AbortController` + `Promise.race` para timeout.
- `probeD1(env): Promise<void>` — `await env.DB.prepare('SELECT 1').first()`.
- `probeKV(env): Promise<void>` — `await env.SESSION.get('health-probe')`.
- `probeR2(env): Promise<void>` — `await env.BUCKET.head('health.txt')` (asume objeto sembrado en bootstrap).
- `probeSES(): Promise<void>` — `new SESClient({ region: 'us-east-1' })` (instanciación no-op).
- `runHealthChecks(env): Promise<HealthResponse>` — orquesta los 4 con `Promise.all`, mide `performance.now()` por probe.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/health-check.test.ts` — `checkBinding` con fn que resuelve < 100ms → `{status:'ok', latency_ms: <100}`; con fn que rechaza → `{status:'down', latency_ms}`; con fn que tarda > timeoutMs → `{status:'timeout'}`. |
| Integración | `tests/integration/health/health.test.ts` (con miniflare) — GET con bindings OK devuelve 200 + status:'ok' + cada componente con latency < 100ms; simular D1 caído (mock que rechaza) → status:'degraded' + d1.status:'down'; simular todos caídos → 503 + status:'down'; verificar header `Cache-Control: no-store`. |
| E2E | `tests/e2e/health.spec.ts` (manual/staging) — `curl https://<staging>/api/v1/health` retorna JSON estructurado. |

## Dependencias y secuencia

- **Bloqueado por:** ninguna HU directa (es fundación de REQ-25).
- **Bloquea a:** HU-25.2 (readiness se apoya en health), HU-25.3 (UptimeRobot configura contra este endpoint).
- **Recursos compartidos:** bindings D1, KV, R2.

## Riesgos técnicos

- Riesgo: `AbortController` no cancela promesas en runtime de Workers, sólo el await retorna → Mitigación: documentar que el probe "sigue corriendo" en background pero la respuesta retorna. Aceptable porque los probes son lecturas livianas.
- Riesgo: la probe SES no detecta problemas reales → Mitigación: documentar que la probe es smoke test; un test E2E real es el envío de un email de prueba (futuro).
- Riesgo: `R2.head('health.txt')` falla si el objeto no existe → Mitigación: agregar paso de bootstrap que cree `health.txt` vacío en R2; documentar en `infra/setup.md`.