# HU-22.4 — Eliminar cuenta con soft delete y anonimización

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-22-compliance-ley-19628

## Historia de usuario

**Como** titular de mis datos
**Quiero** eliminar mi cuenta
**Para** ejercer mi derecho de cancelación

## Criterios de aceptación (Gherkin)

### Escenario: Delete marca soft delete
  Cuando envío `DELETE /api/v1/users/me` con confirm `{"confirm":"ELIMINAR"}`
  Entonces recibo status 204
  Y `users.deleted_at` se setea y `users.email` se reemplaza por `deleted-<uuid>@quien-sabe.local`

### Escenario: Reseñas anonimizadas pero preservadas
  Cuando se ejecuta el delete
  Entonces las filas `reviews` del user mantienen el contenido pero `reviews.user_id_display` se sustituye por "Vecino eliminado"
  Y `users.anonymized_at` queda con timestamp

### Escenario: Sesiones revocadas
  Cuando se completa el delete
  Entonces todas las sesiones KV del user quedan eliminadas (reuse helper HU-19.4)

### Escenario: Confirm faltante → 422
  Cuando envío DELETE sin body `confirm`
  Entonces recibo status 422

### Escenario: Provider profile soft-deleted
  Si el user era prestador
  Cuando se elimina
  Entonces `providers.status="deleted"` y deja de aparecer en búsqueda

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/users/me/index.ts` (DELETE)
- [ ] Servicio `src/lib/services/compliance/delete-account.ts` con transacción D1
- [ ] Reuso de `revokeAllSessions()` (HU-19.4)
- [ ] Tests `tests/integration/compliance/delete-account.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
