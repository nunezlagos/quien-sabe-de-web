# HU-08.2 — Endpoint POST /contacts/track con rate-limit

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-08-contacto-tracking
**Rama:** `feat/HU-08.2-endpoint-track`

## Tareas técnicas

- [ ] **T1** Helper `src/lib/utils/hash.ts` exportando `hashIpUa(ip, ua, salt): Promise<{ipHash, uaHash}>` usando Web Crypto `crypto.subtle.digest('SHA-256', ...)`. Devuelve hex lowercase de 64 chars.
- [ ] **T2** Servicio `src/lib/services/contact-salt.ts` exportando `getCurrentSalt(env): Promise<string>` — lee `contact:salt:<yyyy_mm>` de KV, fallback a `env.CONTACT_HASH_SALT`. Si tampoco existe → usar literal `"dev-fallback-salt"` y loggear warn.
- [ ] **T3** Servicio `src/lib/services/rate-limit.ts` exportando `checkAndIncrement(env, key, limit, ttlSec): Promise<{allowed, current}>` sobre KV (`SESSION` o `RATE_LIMIT`). Increment atómico vía `read+write` (acepta margen +5 documentado).
- [ ] **T4** Validador `trackContactSchema` en `src/lib/validators/contacts.ts` (Zod) — body `{provider_id: number positivo, kind: enum}`.
- [ ] **T5** Implementar `insertContactEvent` en `src/lib/services/contact-events.ts` (HU-08.1 dejó la firma).
- [ ] **T6** Endpoint `src/pages/api/v1/contacts/track.ts`:
  - Lee `CF-Connecting-IP` (fallback `x-forwarded-for` o `0.0.0.0` en dev).
  - Parsea body con Zod → 400 si falla.
  - Calcula hashes con `getCurrentSalt` + `hashIpUa`.
  - `checkAndIncrement('rl:contact:<ip_hash>', 30, 3600)` → 429 si `!allowed`.
  - Verifica `provider_id` existe en `providers` → 422 si no.
  - `insertContactEvent` y responde `new Response(null, { status: 204 })`.
- [ ] **T7** Documentar nueva binding KV en `wrangler.toml.example` (`RATE_LIMIT` con `id` placeholder); decisión final sobre reusar `SESSION` queda en el PR.
- [ ] **T8** Tests:
  - [ ] `tests/unit/utils/hash.test.ts` — SHA-256 hex 64, determinismo, mismo input + salt distinto → hash distinto.
  - [ ] `tests/unit/validators/contacts.test.ts` — body válido pasa; `provider_id` string falla; `kind` fuera de enum falla.
  - [ ] `tests/unit/services/contact-salt.test.ts` — lee de KV; fallback a env; fallback a literal dev.
  - [ ] `tests/unit/services/rate-limit.test.ts` — `allowed=true` bajo límite, `false` al exceder, TTL configurado.
  - [ ] `tests/integration/contacts/track.test.ts` — 204 + fila en `contact_events`, 422 provider inexistente, 429 al 31° request, 400 body inválido, 401 si requiere auth (no aplica — público, validar con test que NO exige sesión).
- [ ] **T9** Verificar manualmente con `curl -X POST` desde host → `docker logs quien-sabe-app` muestra 204.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: cambiar límite de 30 a 1 en el helper → 2° request del test cae en 429 → restaurar
- [ ] Sabotaje 2: comentar la llamada a `insertContactEvent` → 204 pero query `SELECT count(*)` devuelve 0 → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/utils/hash.ts`, `src/lib/services/rate-limit.ts`, `src/lib/services/contact-salt.ts`, `src/lib/validators/contacts.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: endpoint track contacto con rate-limit` y push a rama