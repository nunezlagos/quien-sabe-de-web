# HU-12.2 — Widgets de métricas (últimos 30 días)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.2-widgets-metricas`

## Tareas técnicas

- [ ] **T1** Verificar que `profile_views` exista en `src/database/schema.ts` con índice `(provider_id, created_at)`. Si no existe → generar migración `NNNN_profile_views.sql` con `CHECK` y FK a `providers`.
- [ ] **T2** Servicio `src/lib/services/metrics.service.ts` con `getProviderMetrics`, `computeDelta`, `windowRanges` (firmas en `design.md` §Capa de servicios).
- [ ] **T3** Validador `metricsResponseSchema` en `src/lib/validators/metrics.ts` (Zod, forma completa del response).
- [ ] **T4** Endpoint `src/pages/api/v1/providers/me/metrics.ts` (GET):
  - Lee sesión → 401 si null.
  - 403 si rol !== 'provider'.
  - Llama `getProviderMetrics` con `providerId` de la sesión.
  - Headers `Cache-Control: private, max-age=60`.
- [ ] **T5** Componente `src/components/dashboard/provider/MetricCard.astro` con props `{value, label, accent?, delta?}`. Mockup `mockups/dashboard-provider.html:79-94`. Acepta `accent ∈ {primary, yellow, blue, gray}`.
- [ ] **T6** Componente `src/components/dashboard/provider/MetricsWidgets.astro` con prop `metrics`. Renderiza grid de 4 `MetricCard`. Mockup `mockups/dashboard-provider.html:78-95`. Isla `client:visible` para fetch cuando SSR no recibe datos.
- [ ] **T7** Integrar `MetricsWidgets` en `dashboard-provider.astro` (HU-12.1) bajo anchor `#resumen`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/metrics/delta.test.ts` — `computeDelta` con `prev=0` retorna `null`; deltas positivos/negativos/cero.
  - [ ] `tests/unit/metrics/window-ranges.test.ts` — cálculo de ventanas en UTC, bordes de mes.
  - [ ] `tests/integration/providers/metrics.test.ts` — endpoint con datos agregados, excluye eventos antiguos, aislamiento por provider, sin sesión 401.
  - [ ] `tests/e2e/dashboard-provider-metrics.spec.ts` — las 4 tarjetas renderizan valores del backend.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `computeDelta`, eliminar el guard `prev === 0` → test rojo (división por cero) → restaurar
- [ ] Sabotaje 2: usar `windowRanges` con ventana `previous` igual a `current` → delta = 0 siempre, test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/metrics.service.ts` y `src/lib/validators/metrics.ts`
- [ ] Type check verde
- [ ] Commit `feat: widgets métricas dashboard prestador` y push