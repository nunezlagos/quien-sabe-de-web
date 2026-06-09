# HU-19.4 — Invalidar todas las sesiones tras cambio de password

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-19-recuperacion-password

## Historia de usuario

**Como** plataforma
**Quiero** invalidar todas las sesiones activas de un usuario que reseteó password
**Para** evitar persistencia de atacantes con sesión robada

## Criterios de aceptación (Gherkin)

### Escenario: Reset invalida sesiones existentes
  Dado un user_id=42 con 3 sesiones KV `session:s1`, `session:s2`, `session:s3`
  Cuando completa flujo HU-19.3
  Entonces las 3 keys quedan eliminadas
  Y el siguiente request con cualquiera de esas cookies recibe 401

### Escenario: Sesión nueva sigue válida
  Dado que el usuario hace login tras el reset
  Cuando consulta endpoint protegido
  Entonces recibe 200

### Escenario: Operación atómica
  Cuando el reset se procesa
  Entonces el cambio de password y la revocación KV se aplican en la misma unidad lógica (rollback si falla revocación)

## Tareas técnicas

- [ ] Helper `revokeAllSessions(userId)` en `src/lib/services/auth/sessions.ts` que hace KV list con prefix + delete batch
- [ ] Índice KV secundario `user_sessions:<user_id>` → set de session_ids (para evitar list O(N) sobre todo el namespace)
- [ ] Logear evento `session.revoked.bulk` en observabilidad (REQ-18)
- [ ] Tests `tests/integration/auth/revoke-sessions.test.ts` con miniflare KV

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
