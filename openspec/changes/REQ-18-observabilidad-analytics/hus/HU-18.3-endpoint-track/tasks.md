# HU-18.3 — Endpoint POST /events/track con rate-limit

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.3-endpoint-track`

## Tareas técnicas

- [ ] **T1** Helper `src/lib/utils/hashing.ts` exportando `sha256Hex(input: string): Promise<string>` usando Web Crypto.
- [ ] **T2** Constantes `PII_KEYS` y los schemas Zod por evento (`searchProps`, `signupProps`, etc.) más `trackInput` (discriminated union) en `src/lib/validators/events.ts`. Helper `rejectIfPII(props)` que recorre claves/valores y lanza si detecta email/teléfono/RUT.
- [ ] **T3** Servicio `src/lib/services/analytics/track.service.ts` con `insertEvent(env, {event, actorRole, props})`, `isRateLimited(env, ipHash)`, `bumpRateLimit(env, ipHash)`.
- [ ] **T4** Endpoint `src/pages/api/v1/events/track.ts` (POST, auth opcional):
  - Lee `CF-Connecting-IP` (fallback `x-forwarded-for`).
  - `ipHash = sha256Hex(ip)`.
  - `isRateLimited` → 429 si true.
  - `bumpRateLimit` con TTL 60s, counter 100.
  - Parsea JSON → 400 si falla.
  - `trackInput.parse` → 422 si falla.
  - `rejectIfPII` → 422 con `code:'pii_detected'` si lanza.
  - `actorRole = Astro.locals.session?.role ?? 'anonymous'`.
  - `insertEvent` (D1) → enganche para HU-18.4 (analytics engine emit).
  - 204 sin body.
- [ ] **T5** Tests:
  - [ ] `tests/unit/validators/events.test.ts` — `trackInput.parse` acepta/rechaza por evento; `rejectIfPII` detecta `email`, regex teléfono, regex RUT.
  - [ ] `tests/unit/utils/hashing.test.ts` — SHA-256 hex 64, determinismo.
  - [ ] `tests/unit/services/analytics/track.test.ts` — `isRateLimited` y `bumpRateLimit` con KV mockeado.
  - [ ] `tests/integration/events/track.test.ts` — POST válido → 204 + fila insertada; payload con `email` → 422; 101 requests → 429; `event:'random'` → 422; sin sesión → `actor_role:'anonymous'`.
  - [ ] `tests/e2e/track-search.spec.ts` — click en buscar (`#search-btn` del home) → fila aparece en `events_log` en <60s.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `rejectIfPII`, no detectar email → test integración con payload conteniendo email acepta, retorna 204 con PII persistida → restaurar
- [ ] Sabotaje 2: en `isRateLimited`, invertir la condición (devuelve `false` cuando supera límite) → test integración con 101 requests no da 429 → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/analytics/track.service.ts`, `src/lib/validators/events.ts`
- [ ] Type check verde
- [ ] Commit `feat: endpoint track eventos con rate-limit` y push