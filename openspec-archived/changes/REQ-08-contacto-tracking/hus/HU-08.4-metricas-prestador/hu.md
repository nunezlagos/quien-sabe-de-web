# HU-08.4 — Métricas de contacto para el prestador

**Estado:** implementada-mvp | **Prioridad:** P1 | **REQ padre:** REQ-08-contacto-tracking

## Historia de usuario

**Como** prestador
**Quiero** ver cuántos contactos recibí en los últimos 30 días
**Para** evaluar la efectividad de mi perfil

## Criterios de aceptación (Gherkin)

### Escenario: GET métricas propias
  Dado un prestador con 12 contactos en los últimos 30 días
  Cuando envío `GET /api/v1/providers/me/contact-metrics`
  Entonces recibo `{ total: 12, by_kind: { whatsapp: 8, phone: 3, email: 1 }, last_30d_by_day: [...30] }`

### Escenario: Métricas excluyen eventos > 30 días
  Dado eventos antiguos
  Cuando se calcula
  Entonces no se cuentan en `total`

### Escenario: Otro prestador no puede ver mis métricas
  Dado prestador A consulta con sesión de A
  Cuando consulta métricas
  Entonces sólo ve las propias (provider_id de A)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/providers/me/contact-metrics.ts`
- [ ] Query con agregación por día y por kind
- [ ] Tests `tests/integration/contacts/metrics-provider.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
