# HU-14.7 — Donación recurrente mensual MP

**Estado:** implementada-mvp | **Prioridad:** P2 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante mensual
**Quiero** configurar una donación mensual recurrente
**Para** aportar sostenidamente

## Criterios de aceptación (Gherkin)

### Escenario: Crear suscripción MP
  Cuando envío `POST /api/v1/donations/checkout` con `recurring=true, amount_clp=5000`
  Entonces se crea preferencia de suscripción MP
  Y la fila tiene `recurring=true`

### Escenario: Cobro mensual generan nuevas filas
  Cuando MP notifica cobro mensual exitoso
  Entonces se inserta una nueva donation aprobada ligada a la suscripción

### Escenario: Cancelar suscripción
  Cuando el donante envía `DELETE /api/v1/donations/subscriptions/<id>` con sesión
  Entonces se cancela en MP y `subscription.status="cancelled"`

## Tareas técnicas

- [ ] Tabla `donation_subscriptions` en `src/database/schema.ts`
- [ ] Endpoint `src/pages/api/v1/donations/subscriptions/[id].ts`
- [ ] Tests `tests/integration/donations/recurring.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
