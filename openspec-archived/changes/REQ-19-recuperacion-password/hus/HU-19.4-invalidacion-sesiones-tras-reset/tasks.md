# HU-19.4 — Invalidar todas las sesiones tras cambio de password

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-19-recuperacion-password
**Rama:** `feat/HU-19.4-invalidacion-sesiones-tras-reset`

## Tareas tecnicas

- [ ] **T1** Localizar la API de sesiones de REQ-01. Si `createSession` y `destroySession` existen, evaluar si mantienen `user_sessions:<user_id>`. Si no, crear `src/lib/services/auth/sessions.ts` con la firma completa (`createSession`, `destroySession`, `revokeAllSessions`).
- [ ] **T2** `createSession({ kv }, { userId, sessionId, ttl })`:
  1. `kv.put('session:'+sessionId, { user_id, created_at, expires_at }, { expirationTtl: ttl })`.
  2. Read `user_sessions:`+userId, parsear array (o `[]`), append, write.
- [ ] **T3** `destroySession({ kv }, sid)`:
  1. `kv.get('session:'+sid, 'json')` para obtener `user_id`.
  2. Si existe: read `user_sessions:`+userId, filtrar, write.
  3. `kv.delete('session:'+sid)`.
- [ ] **T4** `revokeAllSessions({ kv }, userId)`:
  1. `kv.get('user_sessions:'+userId, 'json')` (default `[]`).
  2. Para cada `sid`: `kv.delete('session:'+sid)` en try/catch; contar successes.
  3. `kv.delete('user_sessions:'+userId)`.
  4. Retornar `{ revoked: number }`.
  5. Loggear `console.info('[revokeAllSessions]', { userId, revoked })` con metadata estructurada lista para REQ-18.
- [ ] **T5** Integración con HU-19.3: en `consumeResetToken`, después del UPDATE + `kv.delete(token)`, llamar `await revokeAllSessions({ kv }, userId)`. Si lanza, restaurar hash previo y relanzar (HU-19.3 mapea a 500).
- [ ] **T6] Tests:
  - [ ] `tests/unit/auth/sessions.test.ts` — con KV mock:
    - `createSession` × 3 con mismo user → `user_sessions:42` contiene los 3 ids.
    - `destroySession(s1)` → `user_sessions:42` contiene solo s2, s3; `session:s1` eliminada.
    - `revokeAllSessions(42)` con 3 sesiones → 3 deletes + delete del índice; retorna `{ revoked: 3 }`.
    - `revokeAllSessions(99)` sin sesiones → no-op, retorna `{ revoked: 0 }`.
  - [ ] `tests/integration/auth/revoke-sessions.test.ts` con miniflare:
    - Flujo completo: 3 sesiones activas → reset de password → todas las 3 cookies reciben 401; login nuevo OK.
    - `revokeAllSessions` con fallo parcial simulado (mock que rechaza 1 delete) → igual borra el índice y retorna count parcial; test verifica que la app no se cae.
- [ ] **T7] Verificar manualmente: login en 2 navegadores (A y B) con mismo user; en A, hacer reset de password; B debe quedar deslogueado en la próxima request.

## Sabotajes a confirmar

1. En `revokeAllSessions`, olvidar el `kv.delete('user_sessions:'+userId)` final → test integración que verifica "índice eliminado tras revoke" falla → restaurar.
2. En `destroySession`, no actualizar `user_sessions:<user_id>` (no filtrar) → tras varios `destroySession`, el índice contiene ids huérfanos; `revokeAllSessions` intenta `kv.delete` de keys que ya no existen (no falla, pero pierde tiempo); test que verifica "índice no crece" falla.
3. En `createSession`, no actualizar el índice `user_sessions:<user_id>` → `revokeAllSessions` no encuentra ninguna sesión; test que verifica "3 sesiones revocadas" recibe `{ revoked: 0 }` → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/auth/sessions.test.ts tests/integration/auth/revoke-sessions.test.ts` → verde
- [ ] Sabotaje 1 confirmado: `kv.delete` del índice omitido → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: índice desincronizado → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: `createSession` no toca índice → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/auth/sessions.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: revokeAllSessions + indice user_sessions` y push a rama (no merge a main)
