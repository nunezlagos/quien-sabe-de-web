# HU-13.6 — Settings globales editables

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin
**Quiero** editar configuraciones globales (rate limits, SLAs, mensajes)
**Para** ajustar parámetros sin redeploy

## Criterios de aceptación (Gherkin)

### Escenario: Leer settings
  Cuando envía `GET /api/v1/admin/settings`
  Entonces recibo objeto con `{ rate_limit_contact, ticket_sla_hours, legal_terms_version, ... }`

### Escenario: Actualizar parcialmente
  Cuando envía `PATCH /api/v1/admin/settings` con `{"rate_limit_contact": 50}`
  Entonces ese campo se actualiza y se audita
  Y el cache de settings en KV se invalida

### Escenario: Valor inválido → 422
  Cuando envía `rate_limit_contact: -1`
  Entonces recibo status 422

## Tareas técnicas

- [ ] Tabla `settings` (key, value_json, updated_by, updated_at) en `src/database/schema.ts`
- [ ] Endpoints `src/pages/api/v1/admin/settings.ts`
- [ ] Zod schemas para cada clave conocida
- [ ] Cache KV `settings:current` con invalidation
- [ ] Tests `tests/integration/admin/settings.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
