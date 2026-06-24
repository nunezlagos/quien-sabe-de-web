# HU-27.2 — Endpoint activar rol prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-27-multi-rol-cuenta

## Historia de usuario

**Como** vecino existente
**Quiero** activar el rol prestador
**Para** poder ofrecer mis servicios sin crear otra cuenta

## Criterios de aceptación (Gherkin)

### Escenario: Activación exitosa desde dashboard-user
  Dado un vecino con rol único
  Cuando hace clic en "Crear Perfil PRO" (`mockups/dashboard-user.html:80-84`)
  Entonces el client llama `POST /api/v1/users/me/roles/prestador`
  Y se inserta fila `user_roles(user_id, "prestador")`
  Y redirige a `/create-trade` (REQ-21)

### Escenario: Idempotente
  Dado user ya con rol prestador
  Cuando envía POST de nuevo
  Entonces recibo status 200 sin error (no duplica)

### Escenario: Email no verificado bloquea
  Cuando user sin verify (REQ-20) intenta activar
  Entonces recibo status 403

### Escenario: Admin no auto-asignable
  Cuando vecino intenta `POST /api/v1/users/me/roles/admin`
  Entonces recibo status 403 (sólo admin puede otorgar admin)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/roles/[role].ts` (POST)
- [ ] Servicio `addRoleToUser(userId, role)` con whitelist de roles auto-asignables
- [ ] Update sesión KV con nuevo set de roles
- [ ] Tests `tests/integration/auth/activate-role.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
