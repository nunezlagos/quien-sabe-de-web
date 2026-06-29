# HU-08.5 — Métricas globales de contacto para admin

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-08-contacto-tracking
**Rama:** `feat/HU-08.5-metricas-admin`

## Tareas técnicas

- [ ] **T1** Constante `src/lib/config/oe2-target.ts` exportando `OE2_TARGETS = { year1: 5000, year2: 25000 }` y `getOe2TargetForYear(yearOffsetFromLaunch)` con clamp `Math.max(target, 1)` para evitar división por cero.
- [ ] **T2** Constante `LAUNCH_DATE` en el mismo archivo (formato unix seg) — usar fecha del README como anclaje.
- [ ] **T3** Implementar `getGlobalContactMetrics(env, range, nowSec)` en `src/lib/services/contact-events.ts`:
  - `last_30d` → `sinceSec = nowSec - 30*86400`.
  - `ytd` → `sinceSec = startOfYearUTC(nowSec)`.
  - `all` → `sinceSec = 0`.
  - Query `GROUP BY kind, yyyy_mm` (strftime `%Y-%m`).
  - Calcula `yearOffset = floor((nowSec - LAUNCH_DATE) / (365*86400))` y `ytdTotal` con query adicional restringida al año en curso; `progress = ytdTotal / getOe2TargetForYear(yearOffset)`.
- [ ] **T4** Validadores en `src/lib/validators/admin-analytics.ts`:
  - `contactsAnalyticsQuerySchema` (Zod, range enum con default `ytd`).
  - `contactsAnalyticsResponseSchema` (forma completa).
- [ ] **T5** Endpoint `src/pages/api/v1/admin/analytics/contacts.ts` (GET):
  - Sesión admin requerida (helper `requireAdmin(Astro)` shared con REQ-13).
  - Parsea query, calcula `sinceSec`, invoca servicio, responde JSON 200.
  - 401 sin sesión, 403 rol ≠ admin, 400 range inválido.
- [ ] **T6** Componente `src/components/admin/ContactsKpi.astro` — card con total, target del año y barra de progreso `progress * 100%`. Mockup base `mockups/dashboard-admin.html:69-77`.
- [ ] **T7** Componente `src/components/admin/ContactsByMonthChart.astro` — barras mensuales. Mockup `mockups/dashboard-admin.html:117-142`.
- [ ] **T8** Integrar en `src/pages/dashboard/admin.astro` (slot grid de KPIs en REQ-13).
- [ ] **T9** Tests:
  - [ ] `tests/unit/config/oe2-target.test.ts` — `getOe2TargetForYear(0) === 5000`, `(1) === 25000`, `(99) === 25000` (clamp); división por cero no rompe.
  - [ ] `tests/unit/services/contact-events.test.ts` (extender) — `getGlobalContactMetrics` con `range=ytd` filtra por año; `last_30d` filtra por 30d; `by_month` ordenado ASC.
  - [ ] `tests/unit/validators/admin-analytics.test.ts` — range default `ytd`, inválido → error.
  - [ ] `tests/integration/admin/contacts-metrics.test.ts` — 200 admin, 403 vecino, 401 anónimo, `range=last_30d` reduce ventana, `by_month` ordenado.
  - [ ] `tests/e2e/admin-contacts-analytics.spec.ts` — login admin, ver card con total y barra.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: hardcodear `progress = 1.0` → test rojo (`ytd_progress_vs_target !== 1.0` cuando no es total) → restaurar
- [ ] Sabotaje 2: ignorar el filtro `range` y devolver siempre `all` → test rojo (`total` con `last_30d` incluye antiguos) → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/contact-events.ts` (rama metrics), `src/lib/config/oe2-target.ts`
- [ ] Type check verde
- [ ] Commit `feat: métricas globales contacto admin + OE2 target` y push