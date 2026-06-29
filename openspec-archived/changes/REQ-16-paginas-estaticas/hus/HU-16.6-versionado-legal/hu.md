# HU-16.6 — Versionado legal y re-aceptación

**Estado:** planificada | **Prioridad:** P2 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** vecino con sesión
**Quiero** re-aceptar los términos si suben de versión
**Para** mantener consentimientos vigentes

## Criterios de aceptación (Gherkin)

### Escenario: Usuario con versión vieja es interceptado
  Dado un usuario que aceptó `terms_version="v1"` y la versión publicada es `v2`
  Cuando navega a una ruta privada
  Entonces el middleware lo redirige a `/terms?reaccept=true`

### Escenario: Re-aceptación actualiza el campo
  Cuando envía `POST /api/v1/users/me/accept-terms` con `{"version":"v2"}`
  Entonces `users.accepted_terms_at = now` y `users.accepted_terms_version="v2"`

### Escenario: Sin sesión no se intercepta
  Dado visitante anónimo
  Cuando navega
  Entonces no se ve redirigido

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/accept-terms.ts`
- [ ] Lógica de comparación de versión en middleware
- [ ] Vista `src/pages/terms.astro` con CTA re-aceptar si `?reaccept=true`
- [ ] Tests `tests/integration/legal/reaccept.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
