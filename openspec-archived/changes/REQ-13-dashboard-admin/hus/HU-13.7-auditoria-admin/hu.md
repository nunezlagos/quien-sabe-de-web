# HU-13.7 — Log de auditoría de acciones admin

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin (supervisor)
**Quiero** consultar el historial de cambios hechos por admins
**Para** garantizar trazabilidad

## Criterios de aceptación (Gherkin)

### Escenario: Cada acción admin se registra
  Dado un admin que actualiza un usuario
  Cuando se procesa la acción
  Entonces se inserta en `admin_audit_log` con `actor_id, action, entity, entity_id, before_json, after_json, created_at`

### Escenario: GET listado paginado
  Cuando envía `GET /api/v1/admin/audit-log?limit=50`
  Entonces recibo los últimos 50 eventos ordenados desc

### Escenario: Filtro por actor y por entity
  Cuando envía `?actor_id=3&entity=users`
  Entonces los resultados son sólo los matchean

## Tareas técnicas

- [ ] Tabla `admin_audit_log` en `src/database/schema.ts`
- [ ] Helper `logAdminAction(ctx, action, entity, before, after)` en `src/lib/services/audit/admin.ts`
- [ ] Endpoint `src/pages/api/v1/admin/audit-log.ts`
- [ ] Actualizar `mockups/dashboard-admin.html` sidebar (después de Analytics): agregar link `<i class="ri-file-shield-2-line"></i> Auditoría` con `data-target="audit-section"`. Render del contenido con tabla (Fecha, Admin, Acción, Entidad, ID) + filtros `?actor_id=&entity=`.
- [ ] Tests `tests/integration/admin/audit-log.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
