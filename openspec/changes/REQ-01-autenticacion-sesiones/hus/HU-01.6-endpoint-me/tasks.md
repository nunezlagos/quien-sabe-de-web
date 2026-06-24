# HU-01.6 — GET /auth/me para hidratar el cliente

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.6-endpoint-me`

## Tareas tecnicas

- [ ] **T1** Endpoint `src/pages/api/v1/auth/me.ts` con handler `GET`: si `locals.user === undefined` → 401; si `locals.user.status === 'banned'` → `destroySession` + `clearSessionCookie` + 403; en otro caso → 200 con DTO exacto `{ id, email, role, status }`.
- [ ] **T2** Tests:
  - [ ] `tests/integration/auth/me.test.ts` — 3 escenarios:
    - 200 con sesión válida y body ESTRICTAMENTE igual a `{ id, email, role, status }` (sin `passwordHash`, sin campos extra).
    - 401 sin cookie.
    - 403 + `Set-Cookie: session=; Max-Age=0` + key `session:<token>` borrada de KV cuando `users.status='banned'`.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: en el handler, devolver `locals.user` directamente (incluye `passwordHash` si el type lo tiene) → test "DTO exacto sin passwordHash" debe caer por tener campos extra → restaurar (usar destructuring explícito).
- [ ] **Sabotaje 2**: en la rama `banned`, omitir la llamada a `destroySession` → test "403 destruye sesión en KV" debe detectar que la key sigue en KV → restaurar.
- [ ] **Sabotaje 3**: cambiar el return de `banned` a 401 (en lugar de 403) → test "GET /me con sesión banneada" debe detectar status incorrecto → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/pages/api/v1/auth/me.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.6-endpoint-me` (no merge a main sin review)
