# HU-08.4 — Métricas de contacto para el prestador

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-08-contacto-tracking
**Rama:** `feat/HU-08.4-metricas-prestador`

## Tareas técnicas

- [ ] **T1** Implementar `getProviderContactMetrics(env, providerId, sinceSec, untilSec)` en `src/lib/services/contact-events.ts` — query agregada `GROUP BY kind, day` con zero-fill de 30 días (genera array `length=30` aunque no haya eventos). Usa `strftime('%Y-%m-%d', created_at, 'unixepoch')` para day.
- [ ] **T2** Validador `contactMetricsResponseSchema` en `src/lib/validators/contacts.ts` (Zod) — valida `by_kind` con tres campos y `last_30d_by_day.length() === 30`.
- [ ] **T3** Endpoint `src/pages/api/v1/providers/me/contact-metrics.ts` (GET):
  - Lee `Astro.locals.session` → 401 si null.
  - Si `session.role !== 'provider'` o `session.providerId == null` → 403.
  - `sinceSec = Math.floor(Date.now()/1000) - 30*86400`.
  - Llama `getProviderContactMetrics` con el `providerId` de la sesión.
  - Devuelve JSON 200 con la forma validada.
- [ ] **T4** Componente `src/components/dashboard/ContactsKpi.astro` — card con `total`, delta vs período previo, y desglose `by_kind`. Mockup base `mockups/dashboard-provider.html:83-86`. Recibe props desde SSR (sin isla).
- [ ] **T5** Componente `src/components/dashboard/ContactsByDayChart.astro` — sparkline 30 barras (CSS puro, sin librería). Mockup base `mockups/dashboard-admin.html:117-142` (estilo).
- [ ] **T6** Integrar ambos componentes en `src/pages/dashboard/provider.astro` (REQ-12.1 lo define; si aún no existe, crear slot).
- [ ] **T7** Tests:
  - [ ] `tests/unit/services/contact-events.test.ts` — zero-fill: input con 2 días → output de 30 con ceros; agregación correcta por kind; eventos fuera de ventana no se cuentan.
  - [ ] `tests/integration/contacts/metrics-provider.test.ts` — 200 con forma correcta, 401 sin sesión, 403 con sesión de vecino, aislamiento entre proveedores (A no ve eventos de B), eventos > 30d excluidos.
  - [ ] `tests/e2e/dashboard-provider-contacts.spec.ts` — login como prestador seed, ver KPI con número correcto y sparkline renderizado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `getProviderContactMetrics`, retornar `by_day` sin zero-fill → test unitario rojo (length != 30) → restaurar
- [ ] Sabotaje 2: cambiar `sinceSec` a `nowSec` (sin restar 30d) → total incluye eventos antiguos, test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/contact-events.ts` (rama metrics)
- [ ] Type check verde
- [ ] Commit `feat: métricas contacto prestador` y push