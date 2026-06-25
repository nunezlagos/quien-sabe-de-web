# HU-27.4 — Middleware requireRole acepta multi-rol

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-27-multi-rol-cuenta

## Historia de usuario

**Como** plataforma
**Quiero** que los middlewares evalúen el set de roles del usuario
**Para** no bloquear a usuarios con permiso válido aunque su 'rol activo' sea otro

## Criterios de aceptación (Gherkin)

### Escenario: requireRole('prestador') con multi-rol
  Dado user con roles ["vecino","prestador"] y `active_role="vecino"`
  Cuando hace request a endpoint protegido por `requireRole('prestador')`
  Entonces el middleware acepta (200) porque el set incluye prestador

### Escenario: requireRole estricto sin el rol → 403
  Dado user con roles ["vecino"] sólo
  Cuando intenta endpoint prestador
  Entonces recibe 403

### Escenario: requireRole con array OR
  Dado endpoint `requireRole(['prestador','admin'])`
  Cuando user con admin
  Entonces acepta

### Escenario: Logging del rol efectivo
  Cuando middleware acepta
  Entonces se loguea `roles=[...], active=...` para observabilidad

## Tareas técnicas

- [ ] Refactor `src/lib/middleware/auth.ts` cambiando `requireRole(role)` por `requireRole(roleOrRoles)`
- [ ] Helper `hasAnyRole(user, roles)` en `src/lib/services/auth/roles.ts`
- [ ] Migrar callsites en `src/pages/api/v1/**` (grep)
- [ ] Tests `tests/unit/middleware/require-role.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
