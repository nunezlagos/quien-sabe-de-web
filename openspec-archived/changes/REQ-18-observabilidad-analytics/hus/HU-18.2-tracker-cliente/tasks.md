# HU-18.2 — Helper cliente track(event, props)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-18-observabilidad-analytics
**Rama:** `feat/HU-18.2-tracker-cliente`

## Tareas técnicas

- [ ] **T1** `src/lib/client/eventSchemas.ts` exportando `EventName` (union literal) y `EVENT_ALLOWLIST: Record<EventName, ReadonlyArray<string>>` con la forma del `design.md` (signup: ['role'], search: ['trade','commune'], contact: ['provider_id','channel'], review: ['provider_id','rating_bucket'], donation: ['amount_bucket','currency'], ticket_open: ['category']).
- [ ] **T2** `src/lib/client/track.ts` exportando `track(event, props): void` con:
  - Sanitización vía `EVENT_ALLOWLIST[event]` (descarta claves fuera).
  - `navigator.sendBeacon('/api/v1/events/track', new Blob([json], {type:'application/json'}))`.
  - Fallback `fetch('/api/v1/events/track', { method:'POST', keepalive:true, body: json })` cuando `sendBeacon` retorna false.
  - try/catch global que traga excepciones (falla silencioso).
  - Guard `typeof window !== 'undefined'` para evitar ejecución en SSR/build.
- [ ] **T3** Cargar helper desde layout global o islas que disparan eventos. Por ahora cargar desde la isla de home (mockup `mockups/js/home.js:273-277`).
- [ ] **T4** Mockear `globalThis.navigator` en setup de Vitest (vitest.config.ts setupFiles) para que los tests no fallen por ausencia.
- [ ] **T5** Tests:
  - [ ] `tests/unit/client/track.test.ts` — `sendBeacon` mockeado se invoca con URL y blob correctos; props con clave PII (`email`) se elimina; cuando `sendBeacon` retorna false se llama `fetch` con `keepalive:true`; excepciones no se propagan.
  - [ ] `tests/unit/client/eventSchemas.test.ts` — sincronía entre allowlist cliente y Zod backend (importar ambos y comparar llaves).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: en `sanitize`, omitir la verificación contra `EVENT_ALLOWLIST` → test rojo (PII se propaga al beacon) → restaurar
- [ ] Sabotaje 2: quitar el try/catch global → excepción rompe la isla de home, test E2E rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/client/track.ts` y `src/lib/client/eventSchemas.ts`
- [ ] Type check verde
- [ ] Commit `feat: helper cliente track` y push