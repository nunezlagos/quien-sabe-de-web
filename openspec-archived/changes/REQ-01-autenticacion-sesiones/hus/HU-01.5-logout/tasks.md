# HU-01.5 — Logout limpia sesión KV y cookie

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.5-logout`

## Tareas tecnicas

- [ ] **T1** Endpoint `src/pages/api/v1/auth/logout.ts` con handler `POST`: lee cookie `session`, llama `destroySession(env, token)` dentro de try/catch, llama `clearSessionCookie(cookies)` si había cookie, retorna 204.
- [ ] **T2** Redactor de tokens en `src/lib/utils/log.ts` con `redactToken(token: string): string` que retorna `token.slice(0, 8) + '…'`. Usar en el `console.error` del catch.
- [ ] **T3** Tests:
  - [ ] `tests/integration/auth/logout.test.ts` — 204 + cookie Max-Age=0 + key KV borrada cuando había sesión; 204 + ningún acceso a KV cuando no había cookie; 204 + cookie Max-Age=0 cuando el token no existe en KV (idempotente).
  - [ ] `tests/e2e/auth-logout.spec.ts` — login → logout → intentar `/dashboard-user` → redirect a `/login` (la protección por middleware + redirect se valida con HU-02.4 cuando exista; aquí validamos que la cookie ya no está presente tras logout).

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: en `logout.ts`, quitar la rama `if (token) { ... }` y siempre llamar `destroySession(undefined)` → test "Logout sin sesión es idempotente" debe detectar acceso a KV sin token → restaurar.
- [ ] **Sabotaje 2**: comentar la línea `clearSessionCookie(cookies)` → test que inspecciona headers `Set-Cookie` debe detectar que la cookie NO se limpia → restaurar.
- [ ] **Sabotaje 3**: cambiar `destroySession` para que NO borre la key (solo loggee) → test que verifica que la key `session:<token>` ya no existe en KV después del logout debe caer → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/pages/api/v1/auth/logout.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.5-logout` (no merge a main sin review)
