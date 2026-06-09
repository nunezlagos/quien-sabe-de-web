# HU-14.9 — Métrica del ratio donaciones/costos (OE3)

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** admin y público
**Quiero** ver el ratio donaciones/costos en tiempo real
**Para** monitorear OE3 (≥ 80% en mes 12)

## Criterios de aceptación (Gherkin)

### Escenario: Cálculo correcto del ratio
  Dado donaciones aprobadas año=2026 totalizan 800.000 CLP y expenses 1.000.000 CLP
  Cuando se calcula
  Entonces `ratio = 0.80`

### Escenario: Excluye donaciones refunded
  Dado una donación de 100.000 refunded
  Cuando se calcula
  Entonces NO se suma a `donations_total`

### Escenario: Endpoint público expone el ratio mensual
  Cuando envío `GET /api/v1/public/transparency/summary`
  Entonces recibo `{ ratio_ytd, by_month: [...] }`

## Tareas técnicas

- [ ] Servicio `src/lib/services/finance/ratio.ts` reusado
- [ ] Reuso de endpoint `/api/v1/admin/finances/summary`
- [ ] Cache KV de 5 min
- [ ] Tests `tests/unit/finance/ratio-oe3.test.ts`, `tests/integration/finance/ratio-endpoint.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
