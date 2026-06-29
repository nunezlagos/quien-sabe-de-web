# Diseño técnico — HU-18.3 — Endpoint POST /events/track con rate-limit

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

Esta HU consume la tabla creada en HU-18.1. No introduce schema nuevo. Inserta una fila por evento aceptado:

- `id` ← ULID generado en el handler.
- `event` ← validado por Zod.
- `actor_role` ← derivado de `Astro.locals.session?.role ?? 'anonymous'`.
- `props_json` ← `JSON.stringify(zodParsed.props)`.
- `created_at` ← `Date.now()` en el servidor.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/events/track` | POST | opcional (cookie de sesión si existe) | `{ "event": "signup"\|"search"\|"contact"\|"review"\|"donation"\|"ticket_open", "props": <object por evento> }` | 204 sin body | 400 (JSON malformado), 422 (evento desconocido, schema inválido o PII detectada), 429 (rate-limit), 500 (error interno) |

Errores siguen la convención del proyecto: `{ "error": "<mensaje corto>", "code": "<slug>" }`.

## Validaciones Zod

```ts
// src/lib/validators/events.ts (pseudocódigo)
const PII_KEYS = ['email','phone','rut','dni','full_name','address','password'] as const

const searchProps = z.object({
  trade: z.string().min(1).max(64),
  commune: z.string().min(1).max(64).optional(),
}).strict()

const signupProps = z.object({
  role: z.enum(['user','provider']),
}).strict()

const contactProps = z.object({
  provider_id: z.string().min(1).max(64),
  channel: z.enum(['email','whatsapp','phone']),
}).strict()

const reviewProps = z.object({
  provider_id: z.string().min(1).max(64),
  rating_bucket: z.enum(['1','2','3','4','5']),
}).strict()

const donationProps = z.object({
  amount_bucket: z.enum(['<5k','5k-20k','20k-100k','>100k']),
  currency: z.literal('CLP'),
}).strict()

const ticketOpenProps = z.object({
  category: z.enum(['bug','feature','support','other']),
}).strict()

export const trackInput = z.discriminatedUnion('event', [
  z.object({ event: z.literal('signup'),      props: signupProps }),
  z.object({ event: z.literal('search'),      props: searchProps }),
  z.object({ event: z.literal('contact'),     props: contactProps }),
  z.object({ event: z.literal('review'),      props: reviewProps }),
  z.object({ event: z.literal('donation'),    props: donationProps }),
  z.object({ event: z.literal('ticket_open'), props: ticketOpenProps }),
])

export function rejectIfPII(props: Record<string, unknown>): void
```

`rejectIfPII` recorre claves y valores; si alguna clave coincide con `PII_KEYS` o algún valor matchea regex de email/teléfono/RUT, lanza un error que el handler traduce a 422.

## Componentes UI

HU backend. Sin UI.

## Flujo de interacción (secuencial)

1. Cliente (helper HU-18.2) envía `POST /api/v1/events/track` con `Content-Type: application/json`.
2. Handler obtiene `ip_hash = sha256(headers['CF-Connecting-IP'])`.
3. Handler lee `await env.SESSION.get('rl:event:' + ip_hash)`; si `count >= 100`, responde 429.
4. Handler hace `await env.SESSION.put('rl:event:' + ip_hash, String(count+1), { expirationTtl: 60 })`.
5. Handler parsea JSON; si falla, 400.
6. Handler valida con `trackInput.parse`; si falla, 422.
7. Handler invoca `rejectIfPII(parsed.props)`; si lanza, 422 con `code:'pii_detected'`.
8. Handler resuelve `actor_role` desde `Astro.locals.session` o `'anonymous'`.
9. Handler inserta vía Drizzle en `events_log`.
10. (HU-18.4) Handler emite también a `env.ANALYTICS` si está disponible.
11. Handler responde 204.

## Capa de servicios

- `src/lib/services/analytics/track.service.ts` — pseudocódigo:
  - `insertEvent(env, { event, actorRole, props }): Promise<{ id: string }>`
  - `isRateLimited(env, ipHash): Promise<boolean>`
  - `bumpRateLimit(env, ipHash): Promise<void>`
- `src/lib/utils/hashing.ts` — `sha256Hex(input: string): Promise<string>`

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/events.test.ts` | `trackInput.parse` acepta/rechaza por evento; `rejectIfPII` detecta `email`, regex teléfono, regex RUT. |
| Integración | `tests/integration/events/track.test.ts` | POST válido → 204 + fila insertada; payload con `email` → 422; 101 requests → 429; `event:'random'` → 422; sin sesión → `actor_role:'anonymous'`. |
| E2E | `tests/e2e/track-search.spec.ts` | Click en buscar (`#search-btn` del home) → fila aparece en `events_log` en <60s (valida cierre del ciclo cliente→servidor). |

## Dependencias y secuencia

- **Bloqueado por:** HU-18.1 (tabla destino).
- **Bloquea a:** HU-18.4 (engancha en este handler), HU-18.5 (necesita datos reales), HU-18.6 (necesita datos reales).
- **Recursos compartidos:** binding `DB`, binding `SESSION` (KV), middleware de sesión en `src/middleware.ts`.

## Riesgos técnicos

- KV `get/put` no atómico → ventanas pequeñas de exceso del límite; aceptable para 100 req/min.
- `CF-Connecting-IP` no disponible en dev local → fallback a `headers['x-forwarded-for']` o IP del request.
- Sesión expirada con `actor_role` cacheado → middleware ya invalida; el handler solo lee `Astro.locals.session`.
- Coste de `JSON.stringify` repetido para payloads grandes → la allowlist mantiene props pequeños.
