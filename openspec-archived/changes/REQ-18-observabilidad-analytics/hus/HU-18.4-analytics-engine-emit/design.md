# Diseño técnico — HU-18.4 — Doble emisión a Cloudflare Analytics Engine

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

No introduce schema. Reutiliza la tabla `events_log` (HU-18.1) como fuente de verdad y emite además al dataset binding `ANALYTICS`.

Esquema de data point (lógico, no SQL):

- `indexes`: `[event]` — para filtrar por tipo de evento en queries.
- `blobs`: `[actor_role, props_json_short]` — strings de baja cardinalidad.
- `doubles`: `[1]` — contador unitario (para `SUM` en agregaciones).

## Contrato de API

Esta HU no expone endpoints propios. Modifica el comportamiento interno del endpoint definido en HU-18.3 sin cambiar su contrato externo.

## Validaciones Zod

No aplica. La validación de input ya ocurre en HU-18.3 antes de llegar a este módulo.

## Componentes UI

HU backend. Sin UI.

## Flujo de interacción (secuencial)

1. Handler `events/track.ts` recibe payload validado (HU-18.3).
2. Handler invoca `await insertEvent(env, parsed)` (D1).
3. Handler invoca `writeAnalyticsEvent(env, parsed)`:
   1. Si `env.ANALYTICS` es `undefined`, retorna sin acción.
   2. Sino, intenta `env.ANALYTICS.writeDataPoint({ indexes, blobs, doubles })` dentro de try/catch.
   3. Cualquier excepción se loguea con `console.warn` y se traga.
4. Handler responde 204 independientemente del resultado de Analytics Engine.

## Capa de servicios

- `src/lib/services/analytics/engine.ts` — pseudocódigo:
  - `type AnalyticsPayload = { event: EventName; actorRole: string; props: Record<string, unknown> }`
  - `export function hasAnalyticsBinding(env: Env): boolean`
  - `export function writeAnalyticsEvent(env: Env, payload: AnalyticsPayload): void`
  - `function toDataPoint(payload: AnalyticsPayload): { indexes: string[]; blobs: string[]; doubles: number[] }`

Wiring en `wrangler.toml`:

- `[[analytics_engine_datasets]]` con `binding = "ANALYTICS"` y `dataset = "qsd_events"`.
- En `src/env.d.ts`, añadir `ANALYTICS?: AnalyticsEngineDataset` al tipo del runtime.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/analytics/engine.test.ts` | `toDataPoint` mapea correctamente; `writeAnalyticsEvent` no lanza con binding `undefined`; con mock que lanza, no propaga. |
| Integración | `tests/integration/events/analytics-engine.test.ts` | POST a `/api/v1/events/track` con mock de binding → `writeDataPoint` llamado con payload esperado; mock lanzando → D1 igual inserta, respuesta 204; sin binding → solo D1. |

## Dependencias y secuencia

- **Bloqueado por:** HU-18.1 (tabla destino) y HU-18.3 (handler donde se engancha).
- **Bloquea a:** HU-18.5 (si se opta por consultar Analytics Engine para los KPIs en lugar de D1 puro).
- **Recursos compartidos:** binding `ANALYTICS` declarado en `wrangler.toml`; tipo `Env` en `src/env.d.ts`.

## Riesgos técnicos

- En dev local no hay Analytics Engine real → el guard `hasAnalyticsBinding` mantiene el path degradado activo.
- Cardinalidad alta en `blobs` (props con muchas variantes) → la allowlist (HU-18.2) limita el espacio; documentar evitar valores libres del usuario en `blobs`.
- Asincronía de `writeDataPoint` → según docs CF, la llamada es fire-and-forget desde el Worker; no hay que `await` para responder rápido.
- Si más adelante se opta por consultar Analytics Engine desde HU-18.5, requerirá token de API para el endpoint de queries (no resuelve esta HU).
