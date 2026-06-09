# HU-01.5 — Logout limpia sesión KV y cookie

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** usuario autenticado
**Quiero** cerrar mi sesión de forma segura
**Para** que el token quede invalidado en KV y en el navegador

## Criterios de aceptación (Gherkin)

### Escenario: Logout exitoso
  Dado un usuario autenticado con cookie `session=<token>` válida
  Cuando envío `POST /api/v1/auth/logout`
  Entonces recibo status 204
  Y la entrada `session:<token>` en KV es eliminada
  Y la cookie `session` es limpiada (Set-Cookie con Max-Age=0)

### Escenario: Logout sin sesión es idempotente
  Dado un request sin cookie `session`
  Cuando envío `POST /api/v1/auth/logout`
  Entonces recibo status 204
  Y no se intenta ningún acceso a KV

### Escenario: Logout con token ya expirado
  Dado una cookie `session=<token>` cuyo registro KV ya no existe
  Cuando envío `POST /api/v1/auth/logout`
  Entonces recibo status 204
  Y la cookie es limpiada igual

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/logout.ts`
- [ ] Helper `destroySession(token)` en `src/lib/services/auth/session.ts`
- [ ] Reuso de `clearSessionCookie` en `src/lib/utils/cookies.ts`
- [ ] Tests `tests/integration/auth/logout.test.ts` y E2E `tests/e2e/auth-logout.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
