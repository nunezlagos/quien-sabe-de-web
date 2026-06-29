# HU-12.2 — Widgets de métricas (últimos 30 días)

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver mis métricas clave en un vistazo
**Para** saber cómo va mi perfil

## Criterios de aceptación (Gherkin)

### Escenario: GET métricas resumen
  Cuando prestador envía `GET /api/v1/providers/me/metrics`
  Entonces recibo `{ views_30d, contacts_30d, rating_avg, reviews_count, delta_vs_prev_30d: { views, contacts } }`
  Y los 4 widgets del mockup `dashboard-provider.html` (Vistas 30d, Contactos 30d, Valoración Media, Reseñas) corresponden 1:1 a estos campos
  Y NO se renderiza "Mensajes Nuevos" (campo `messages_new` descartado del contrato)

### Escenario: Cálculo de delta vs 30d previos
  Dado views actual=120 y views previo=100
  Cuando se calcula delta
  Entonces `delta_vs_prev_30d.views = 0.20` (20%)

### Escenario: Sin datos previos delta es null
  Dado prestador nuevo sin historial
  Cuando se consulta
  Entonces `delta_vs_prev_30d.views = null`

### Escenario: Otro prestador no ve métricas ajenas
  Dado prestador A consulta
  Cuando responde
  Entonces sólo retorna métricas del provider_id de A

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/metrics.ts`
- [ ] Agregados Drizzle sobre `contact_events`, `reviews` (y vistas si existe tabla)
- [ ] Componente `src/components/dashboard/provider/MetricsWidgets.astro`
- [ ] Tests `tests/unit/metrics/delta.test.ts`, `tests/integration/providers/metrics.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
