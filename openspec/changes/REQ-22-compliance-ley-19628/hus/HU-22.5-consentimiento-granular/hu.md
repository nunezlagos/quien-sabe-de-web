# HU-22.5 — Consentimiento granular por finalidad

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** titular
**Quiero** habilitar o deshabilitar tratamientos específicos
**Para** controlar el uso de mis datos

## Criterios de aceptación (Gherkin)

### Escenario: Toggle desactiva comunicaciones
  Dado consentimiento previo `communications=true`
  Cuando envío `PATCH /api/v1/users/me/consent` con `{"communications":false}`
  Entonces no se envían emails de marketing (transaccionales sí siguen)

### Escenario: Toggle analytics afecta REQ-18
  Cuando `analytics=false`
  Entonces el cliente y el backend dejan de registrar eventos opcionales

### Escenario: Toggle perfil público (sólo prestadores)
  Cuando `public_profile=false`
  Entonces el perfil deja de aparecer en búsqueda y `/p/:slug` devuelve 404

### Escenario: Historial preservado en user_consents
  Cuando cambio cualquier toggle
  Entonces se inserta nueva fila en `user_consents` (no se sobrescribe)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/consent.ts` (PATCH)
- [ ] Tabla Drizzle `user_consents` (append-only)
- [ ] Middleware `consentRequired(purpose)` para acciones dependientes
- [ ] Tests `tests/integration/compliance/consent.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
