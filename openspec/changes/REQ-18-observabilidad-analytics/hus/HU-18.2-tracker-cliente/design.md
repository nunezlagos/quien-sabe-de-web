# Diseño técnico — HU-18.2 — Helper cliente track(event, props)

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

HU cliente puro. No toca DB. (Sección omitida.)

## Contrato de API

El helper consume el endpoint definido en HU-18.3. Resumen del contrato que produce el helper:

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/events/track` | POST | opcional (cookie de sesión si existe) | `{ "event": <enum>, "props": <object sanitizado por allowlist> }` | 204 (no body) | Helper no lee errores, falla silencioso |

## Validaciones Zod

El helper realiza validación de allowlist en cliente (no Zod). El Zod estricto vive en HU-18.3. Pseudocódigo del descriptor:

```ts
// src/lib/client/eventSchemas.ts (pseudocódigo)
export const EVENT_ALLOWLIST: Record<EventName, ReadonlyArray<string>> = {
  signup:      ['role'],
  search:      ['trade', 'commune'],
  contact:     ['provider_id', 'channel'],
  review:      ['provider_id', 'rating_bucket'],
  donation:    ['amount_bucket', 'currency'],
  ticket_open: ['category'],
}
```

## Componentes UI

HU sin componentes propios. Se consume desde islas existentes/futuras. Punto de integración en mockup:

- `mockups/js/home.js:273` — `searchBtn` → invocará `track('search', { trade, commune })` desde la isla Astro equivalente.
- `mockups/js/home.js:277` — `tradeSelect change` → mismo evento.
- Islas requeridas: sí (el helper es código cliente, debe cargarse en islas que disparan eventos; no se ejecuta en SSR).

## Flujo de interacción (secuencial)

1. Usuario hace click en `#search-btn` (mockup `index.html:108`).
2. La isla Astro de home invoca `track('search', { trade: tradeSelect.value, commune: communeSelect.value })`.
3. Helper aplica `EVENT_ALLOWLIST.search` y descarta cualquier clave fuera de la allowlist.
4. Helper serializa `{ event, props }` y llama `navigator.sendBeacon('/api/v1/events/track', blob)`.
5. Si `sendBeacon` retorna `false`, helper hace `fetch('/api/v1/events/track', { method:'POST', keepalive:true, body })`.
6. Cualquier excepción se traga (try/catch) — la HU exige fallo silencioso.

## Capa de servicios

- `src/lib/client/track.ts` — pseudocódigo de signatures:
  - `export type EventName = 'signup'|'search'|'contact'|'review'|'donation'|'ticket_open'`
  - `export function track(event: EventName, props: Record<string, unknown>): void`
  - `function sanitize(event: EventName, props: Record<string, unknown>): Record<string, unknown>`
- `src/lib/client/eventSchemas.ts` — exporta `EVENT_ALLOWLIST` y type `EventName`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/client/track.test.ts` | (a) `sendBeacon` mockeado se invoca con URL y blob correctos; (b) props con clave PII (`email`) se elimina; (c) cuando `sendBeacon` retorna false se llama `fetch` con `keepalive:true`; (d) excepciones no se propagan. |
| Unit | `tests/unit/client/eventSchemas.test.ts` | Sincronía entre allowlist cliente y Zod backend (importa ambos módulos y compara llaves). |

## Dependencias y secuencia

- **Bloqueado por:** HU-18.3 (necesita endpoint para que el contrato sea real; en TDD el cliente puede mockearlo antes).
- **Bloquea a:** integración de tracking en cualquier vista (search, signup, donation, etc.).
- **Recursos compartidos:** ninguno con otras HUs en cliente. Comparte la lista de eventos con Zod backend.

## Riesgos técnicos

- `sendBeacon` no acepta payloads > 64 KiB → la allowlist garantiza payloads pequeños.
- Diferencia de timing entre cliente y servidor (`createdAt` lo fija el servidor; no enviar timestamp desde cliente) → documentar.
- `globalThis.navigator` indefinido en tests → mockear en setup de Vitest.
