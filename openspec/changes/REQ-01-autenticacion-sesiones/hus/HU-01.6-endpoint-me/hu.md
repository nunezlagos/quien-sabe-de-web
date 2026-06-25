# HU-01.6 — GET /auth/me para hidratar el cliente

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-01-autenticacion-sesiones

## Historia de usuario

**Como** cliente (frontend Astro o consumer API)
**Quiero** consultar el usuario asociado a mi sesión
**Para** hidratar la UI sin re-consultar otros endpoints

## Criterios de aceptación (Gherkin)

### Escenario: GET /me con sesión válida
  Dado un usuario "ana@ejemplo.cl" con rol `vecino` y sesión activa
  Cuando envío `GET /api/v1/auth/me`
  Entonces recibo status 200
  Y la respuesta es `{ id, email, role: "vecino", status: "active" }`
  Y NO contiene password_hash

### Escenario: GET /me sin sesión
  Dado un request sin cookie `session`
  Cuando envío `GET /api/v1/auth/me`
  Entonces recibo status 401 con `{ "error": "no autenticado" }`

### Escenario: GET /me con sesión banneada
  Dado un usuario con `status="banned"` pero token aún en KV
  Cuando envío `GET /api/v1/auth/me`
  Entonces recibo status 403 con `{ "error": "cuenta deshabilitada" }`
  Y la sesión es destruida en KV

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/me.ts`
- [ ] Reuso del middleware global para poblar `locals.user`
- [ ] Tests `tests/integration/auth/me.test.ts` cubriendo los 3 escenarios

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
