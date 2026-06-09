# HU-17.2 — Tabla email_log para auditoría

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** sistema
**Quiero** registrar cada email enviado
**Para** auditar entregas y debuggear fallas

## Criterios de aceptación (Gherkin)

### Escenario: Cada send inserta fila
  Cuando `EmailService.send` se invoca
  Entonces se inserta en `email_log (template, recipient, status, related_entity, sent_at, error?)`
  Y `status="sent"` si OK, `status="failed"` con `error` si falla

### Escenario: Fallo no interrumpe flujo
  Dado SMTP devuelve 500
  Cuando se envía
  Entonces se loguea con `status="failed"` y la función no lanza

### Escenario: Consulta paginada admin
  Cuando admin envía `GET /api/v1/admin/email-log?limit=50`
  Entonces recibo lista paginada

## Tareas técnicas

- [ ] Schema `email_log` en `src/database/schema.ts`
- [ ] Helper `logEmail(...)` en `src/lib/services/email/log.ts`
- [ ] Endpoint admin `src/pages/api/v1/admin/email-log.ts`
- [ ] Tests `tests/integration/email/log.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
