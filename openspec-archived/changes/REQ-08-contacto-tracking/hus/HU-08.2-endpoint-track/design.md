# Diseno tecnico — HU-08.2 — Endpoint POST /contacts/track con rate-limit

**REQ padre:** REQ-08-contacto-tracking

## Modelo de datos

Reutiliza la tabla `contact_events` definida en HU-08.1. No se introducen tablas nuevas.

Adicionalmente se usa Cloudflare KV (binding `SESSION` o un nuevo binding `RATE_LIMIT` según `wrangler.toml`) con claves:

| Clave KV | Valor | TTL |
|---|---|---|
| `rl:contact:<ip_hash>` | contador numérico (string) | 3600 s |
| `contact:salt:<yyyy_mm>` | salt vigente del mes (hex 32) | sin TTL, rotado por cron externo |

## Contrato de API

| Endpoint | Metodo | Auth | Request body | Response 204 | Errores |
|---|---|---|---|---|---|
| `/api/v1/contacts/track` | POST | público (sin sesión) | `{ "provider_id": number, "kind": "whatsapp" \| "phone" \| "email" }` | sin body | 400 (Zod), 422 (provider inexistente), 429 (rate-limit superado) |

Headers usados (lectura):
- `CF-Connecting-IP` (provisto por Cloudflare) → entrada para `ip_hash`.
- `User-Agent` → entrada para `ua_hash`.

## Validaciones Zod

```ts
// src/lib/validators/contacts.ts (firmas, sin logica)
export const trackContactSchema = z.object({
  provider_id: z.number().int().positive(),
  kind: z.enum(['whatsapp', 'phone', 'email']),
})
// Salida normalizada: { providerId, kind }
```

## Componentes UI

No aplica. Esta HU expone sólo un endpoint backend; el wiring del cliente vive en HU-08.3.

## Flujo de interaccion (secuencial)

1. Cliente (HU-08.3) llama `navigator.sendBeacon('/api/v1/contacts/track', payload)`.
2. Handler en `src/pages/api/v1/contacts/track.ts` lee `CF-Connecting-IP` y `User-Agent`.
3. Parsea el body con `trackContactSchema` (Zod). Si falla → 400.
4. Calcula `ip_hash = sha256(ip + salt_mes)` y `ua_hash = sha256(ua + salt_mes)` vía `src/lib/utils/hash.ts`.
5. Consulta KV `rl:contact:<ip_hash>`. Si counter ≥ 30 → 429.
6. Verifica que `provider_id` existe en `providers` (consulta Drizzle). Si no → 422.
7. Inserta fila en `contact_events` vía `insertContactEvent` (servicio HU-08.1).
8. Incrementa counter KV con TTL 3600 si era la primera escritura del bucket.
9. Responde 204 sin body.

## Capa de servicios

- `src/lib/services/contact-events.ts`:
  - `insertContactEvent(env, input): Promise<void>` (definido en HU-08.1).
- `src/lib/services/rate-limit.ts`:
  - `checkAndIncrement(env, key: string, limit: number, ttlSec: number): Promise<{ allowed: boolean, current: number }>`.
- `src/lib/utils/hash.ts`:
  - `hashIpUa(ip: string, ua: string, salt: string): Promise<{ ipHash: string, uaHash: string }>` — usa Web Crypto `crypto.subtle.digest('SHA-256', ...)`.
- `src/lib/services/contact-salt.ts`:
  - `getCurrentSalt(env): Promise<string>` — lee `contact:salt:<yyyy_mm>` de KV, fallback a `env.CONTACT_HASH_SALT`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/hash.test.ts` | SHA-256 hex 64, determinismo, diferencia por salt |
| Unit | `tests/unit/validators/contacts.test.ts` | Zod acepta body válido, rechaza body inválido |
| Integracion | `tests/integration/contacts/track.test.ts` | 204 + fila insertada, 422 provider, 429 rate-limit, 400 body inválido |

## Dependencias y secuencia

- **Bloqueado por:** HU-08.1 (tabla `contact_events`).
- **Bloquea a:** HU-08.3 (cliente sendBeacon), HU-08.4 y HU-08.5 (necesitan eventos persistidos).
- **Recursos compartidos:**
  - Binding D1 `Astro.locals.runtime.env.DB`.
  - Binding KV (`SESSION` o `RATE_LIMIT`) según definición en `wrangler.toml`.
  - Secret `CONTACT_HASH_SALT` (env) como fallback.

## Riesgos tecnicos

- Riesgo: `crypto.subtle` no disponible en runtime de tests → Mitigación: pool `@cloudflare/vitest-pool-workers` lo expone igual que Workers prod.
- Riesgo: KV eventualmente consistente subestima el counter → Mitigación: aceptar margen +5; documentar.
- Riesgo: Cloudflare puede entregar `CF-Connecting-IP` vacío en local → Mitigación: fallback a `x-forwarded-for` o `0.0.0.0` durante dev (no en prod).
- Riesgo: respuesta 204 con body genera warning en algunos clientes → Mitigación: responder con `new Response(null, { status: 204 })`.
