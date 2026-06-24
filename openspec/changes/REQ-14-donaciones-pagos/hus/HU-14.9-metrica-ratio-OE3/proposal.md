# Propuesta — HU-14.9 — Métrica del ratio donaciones/costos (OE3)

**Estado:** propuesta | **REQ padre:** REQ-14-donaciones-pagos

## Contexto

OE3 requiere mantener un ratio donaciones/costos ≥ 80% en el mes 12. Esta HU implementa el servicio de cálculo (`computeRatio`) y dos endpoints consumidores: uno admin (HU-13.5, devuelve desglose) y uno público (REQ-15 transparencia, devuelve ratio agregado). El cálculo excluye donaciones refunded y maneja correctamente el caso expenses=0 (devuelve `null` con flag `no_expenses=true` para evitar división por cero). El mismo servicio se cachea en KV con TTL 5 min.

## Mockups de referencia

- `mockups/transparency.html:46-58` — 3 cards KPI: Ingresos / Gastos Fijos / Fondo Reserva. El endpoint público alimenta estas cards. El admin (HU-13.5) tiene más desglose.

## Alternativas considered

### Opcion A — Servicio puro `computeRatio(donations, expenses)` con tests unit + dos endpoints consumidores
- Función pura testeable. Endpoints (admin y público) la envuelven con queries SQL y formato distinto.
- Pro: la lógica crítica del OE3 está en UN lugar, testeable sin DB.
- Pro: el admin y el público siempre coinciden en el número.
- Contra: requiere disciplina de no duplicar lógica.

### Opcion B — Endpoint único con parámetro `audience=admin|public`
- Pro: un solo endpoint.
- Contra: payload-shape divergence en código vs tipo; más difícil de mantener.

### Opcion C — Cálculo en cliente (JS)
- Pro: cero código server-side.
- Contra: requiere exponer donations/expenses crudos al cliente; inaceptable por privacidad y volumen.

## Decision

Se elige **Opcion A**. `src/lib/services/finance/ratio.ts` con función pura `computeRatio(donations: number, expenses: number): { ratio: number | null, noExpenses: boolean }`. Los endpoints admin (HU-13.5) y público (HU-14.9 `GET /api/v1/public/transparency/summary`) consumen esta función. Cache KV 5 min con key distinta por audiencia.

## Riesgos y mitigaciones

- Riesgo: donations/expenses vienen como string desde la DB y rompen la división → Mitigación: el helper acepta `number` y la query SQL hace `CAST(SUM(...) AS REAL)`.
- Riesgo: ratio con `null` se renderiza como "NaN%" en UI → Mitigación: helper de formato `formatRatio(ratio | null): string` que muestra "—" si null.
- Riesgo: cache stale de 5 min en plena campaña de donación → Mitigación: aceptable; el admin puede forzar refresh (mismo botón que en HU-13.4).

## Metrica de exito

- `computeRatio(800000, 1000000)` → `{ ratio: 0.8, noExpenses: false }`.
- `computeRatio(50000, 0)` → `{ ratio: null, noExpenses: true }`.
- `computeRatio(0, 1000000)` → `{ ratio: 0, noExpenses: false }`.
- GET `/api/v1/public/transparency/summary` (público) → 200 con `{ ratio_ytd, by_month }`.
- GET con cache → segunda llamada HIT <50ms.
- E2E público: visitante ve ratio en `/transparency`.
