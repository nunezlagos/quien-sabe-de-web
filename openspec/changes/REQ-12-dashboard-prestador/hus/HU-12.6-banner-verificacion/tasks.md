# HU-12.6 — Banner de estado de verificación

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.6-banner-verificacion`

## Tareas técnicas

- [ ] **T1** Verificar que `verifications` exista en `src/database/schema.ts` con la forma del REQ-03. Si no → migración `NNNN_verifications.sql` con índice en `provider_id`, default `status = 'not_requested'`.
- [ ] **T2** Servicio `src/lib/services/verification.service.ts` con `getVerificationStatus(env, userId): Promise<{status, rejectionReason: string | null}>`. Si no hay fila → `{status: 'not_requested', rejectionReason: null}`. Wrap en try/catch para no romper el dashboard si la tabla no existe.
- [ ] **T3** Validador `verificationStatusSchema` en `src/lib/validators/verification.ts` (Zod enum).
- [ ] **T4** Componente `src/components/dashboard/provider/VerificationBanner.astro` con props `{status, rejectionReason?}`. Lógica condicional:
  - `verificado` → `null` (no renderiza).
  - `pendiente` → banner amarillo con icono `ri-time-line`.
  - `rechazado` → banner rojo con icono `ri-error-warning-line`, motivo y CTA "Reenviar" → `/verification`.
  - `not_requested` → banner azul con CTA "Verifica tu oficio" → `/verification`.
  - Patrón visual: `mockups/verification.html:42-48`.
- [ ] **T5** Integrar `VerificationBanner` en `dashboard-provider.astro` entre el header del panel principal y los widgets de métricas.
- [ ] **T6** Resolver `getVerificationStatus` en SSR (dentro de `dashboard-provider.astro`) y pasar al banner como prop.
- [ ] **T7** Tests:
  - [ ] `tests/unit/services/verification-status.test.ts` — mapeo correcto: fila `verificado` → `{status: 'verificado'}`; sin fila → `{status: 'not_requested'}`; fila `rechazado` con `rejection_reason` → lo incluye.
  - [ ] `tests/unit/components/verification-banner.test.ts` (jsdom + snapshot) — cada estado renderiza el HTML esperado (banner amarillo/rojo/azul/ausente).
  - [ ] `tests/integration/dashboard/verification-banner.test.ts` — render del dashboard expone el banner adecuado según fila en `verifications`.
  - [ ] `tests/e2e/provider-verification-banner.spec.ts` — login como prestador con cada estado → ver banner correcto.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `VerificationBanner`, eliminar el early return para `verificado` → test snapshot falla (muestra banner en estado verificado) → restaurar
- [ ] Sabotaje 2: en `getVerificationStatus`, lanzar error si no hay fila → el dashboard rompe, test integración falla → restaurar (try/catch debe devolver `not_requested`)
- [ ] Coverage ≥ 90 % en `src/lib/services/verification.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: banner estado verificación en dashboard` y push