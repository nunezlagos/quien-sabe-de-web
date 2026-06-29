# HU-02.3 — Preferencias de notificación e intereses

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-02-onboarding-vecino

## Historia de usuario

**Como** vecino con perfil completo
**Quiero** ajustar mis preferencias de notificación e intereses
**Para** recibir comunicaciones útiles y filtrar lo que veo

## Criterios de aceptación (Gherkin)

### Escenario: Guardar preferencias por primera vez
  Dado un vecino sin entrada en `user_preferences`
  Cuando envío `PATCH /api/v1/users/me/profile` con `{"preferences": {"notify_email": true, "interests": ["gasfiter", "electricista"]}}`
  Entonces recibo status 200
  Y la tabla `user_preferences` tiene una fila con `notify_email=true` y `interests=["gasfiter","electricista"]`

### Escenario: Actualizar parcialmente conserva valores no enviados
  Dado un vecino con `notify_email=true` y `interests=["gasfiter"]`
  Cuando envío `PATCH /api/v1/users/me/profile` con `{"preferences": {"notify_email": false}}`
  Entonces `notify_email=false`
  Y `interests` sigue siendo `["gasfiter"]`

### Escenario: Interés con slug inválido → 422
  Cuando envío `interests: ["oficio-inexistente"]`
  Entonces recibo status 422 con detalle del slug inválido

## Tareas técnicas

- [ ] Tabla `user_preferences` en `src/database/schema.ts`
- [ ] Zod schema `PreferencesPatch` con whitelist contra `trades`
- [ ] Endpoint `PATCH /api/v1/users/me/profile` extendido
- [ ] Componente `src/components/onboarding/PreferencesStep.astro`
- [ ] Tests `tests/unit/validators/preferences.test.ts`, `tests/integration/onboarding/preferences.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
