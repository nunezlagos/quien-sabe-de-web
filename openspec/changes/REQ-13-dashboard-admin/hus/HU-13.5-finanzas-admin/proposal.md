# Propuesta — HU-13.5 — Sección finanzas admin (donaciones/costos)

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

Para tomar decisiones hacia OE3 (ratio donaciones/costos ≥ 80% en mes 12), el admin necesita ver el agregado histórico de donaciones, costos y el ratio calculado. La lógica de cálculo vive en HU-14.9 (servicio `computeRatio`); esta HU arma la sección visual y el endpoint admin que la alimenta. Diferencia clave con HU-14.9: esta HU devuelve el resumen al ADMIN (incluye detalles internos como gastos operativos), mientras HU-14.9 también expone un endpoint público con datos agregados.

## Mockups de referencia

- `mockups/dashboard-admin.html:268-274` — placeholder "Sección Finanzas — Próximamente". Esta HU lo implementa.
- `mockups/transparency.html:46-58` — 3 KPIs (Ingresos, Gastos Fijos, Fondo Reserva). El patrón visual se replica en la sección admin pero con más desglose (tabla mensual).

## Alternativas considered

### Opcion A — Endpoint admin `/api/v1/admin/finances/summary` que reusa `computeRatio` de HU-14.9
- Pro: una sola fuente de verdad para el cálculo del ratio.
- Pro: el admin puede pasar filtros de rango sin duplicar lógica.
- Contra: el admin ve `donations` y `expenses` separados; el público sólo el ratio (HU-14.9).

### Opcion B — Endpoint dedicado que duplica `computeRatio` localmente
- Pro: cero acoplamiento con HU-14.9.
- Contra: dos implementaciones del mismo cálculo; drift garantizado.

### Opcion C — Vista única que consume el endpoint público de HU-14.9 + agrega gastos vía endpoint separado
- Pro: aísla el "qué ve el público" del "qué ve el admin".
- Contra: dos requests por render; misma lógica vive en dos lados.

## Decision

Se elige **Opcion A**. El endpoint admin importa `computeRatio` de `src/lib/services/finance/ratio.ts` (definido en HU-14.9, mismo path), agrega detalles de donaciones (count, top donadores anónimos vs identificados) y gastos operativos (desglose por categoría). El endpoint público de HU-14.9 consume el mismo servicio pero arma un payload reducido.

## Riesgos y mitigaciones

- Riesgo: gastos operativos son información sensible (proveedores, sueldos) → Mitigación: el endpoint es admin-only (HU-13.1) y el cache es de KV con key admin-only (no se cross-cachea con el público).
- Riesgo: el cálculo con filtros `from`/`to` requiere timezone correcto → Mitigación: aceptar fechas como `YYYY-MM-DD` interpretadas en UTC; documentar en API.
- Riesgo: `expenses` no existe aún (no se ha modelado) → Mitigación: el servicio detecta ausencia de tabla y devuelve `pending_data` por KPI, igual que HU-13.4.

## Metrica de exito

- GET `/api/v1/admin/finances/summary?from=2026-01-01&to=2026-06-30` → 200 con `{ donations_total_clp, expenses_total_clp, ratio, by_month: [...] }`.
- Expenses=0, donations>0 → `ratio = null` con `no_expenses: true`.
- Vecino → 403.
- E2E: admin abre sección finanzas → ve KPIs + tabla mensual.
