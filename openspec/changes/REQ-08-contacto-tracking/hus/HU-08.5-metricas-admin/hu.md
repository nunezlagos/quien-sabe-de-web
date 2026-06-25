# HU-08.5 — Métricas globales de contacto para admin

**Estado:** implementada | **Prioridad:** P1 | **REQ padre:** REQ-08-contacto-tracking

## Historia de usuario

**Como** admin
**Quiero** ver el total de contactos efectivos en la plataforma
**Para** evaluar OE2 (5.000 / 25.000 contactos año 1 / año 2)

## Criterios de aceptación (Gherkin)

### Escenario: GET métricas globales agregadas
  Cuando admin envía `GET /api/v1/admin/analytics/contacts?range=ytd`
  Entonces recibo `{ total, by_kind: {...}, by_month: [{yyyy_mm, count}], ytd_progress_vs_target: 0.42 }`

### Escenario: Filtrar por rango temporal
  Cuando envío `?range=last_30d`
  Entonces los datos se acotan a los últimos 30 días

### Escenario: No-admin → 403
  Dado un usuario rol vecino
  Cuando consulta el endpoint
  Entonces recibo status 403

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/admin/analytics/contacts.ts`
- [ ] Target OE2 (5000 año1, 25000 año2) configurable en `settings`
- [ ] Componente `src/components/admin/ContactsKpi.astro` en dashboard
- [ ] Tests `tests/integration/admin/contacts-metrics.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
