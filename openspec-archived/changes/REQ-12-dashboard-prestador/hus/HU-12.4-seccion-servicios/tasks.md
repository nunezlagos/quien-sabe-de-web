# HU-12.4 — Sección de gestión de servicios inline

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.4-seccion-servicios`

## Tareas técnicas

- [ ] **T1** Verificar que `services.status` exista en `src/database/schema.ts`. Si falta → migración `NNNN_services_status.sql` con `ADD COLUMN status TEXT NOT NULL DEFAULT 'active'` y `CHECK (status IN ('active','inactive'))`.
- [ ] **T2** Servicio `src/lib/services/services.service.ts` con `listServicesForProvider`, `createService`, `updateService` (verifica ownership), `deleteService` (verifica ownership). Reuso REQ-05.
- [ ] **T3** Validador `serviceCreateSchema` y `serviceUpdateSchema` en `src/lib/validators/services.ts` (reuso REQ-05).
- [ ] **T4** Componente `src/components/dashboard/provider/ServicesSection.astro` con prop `services`. Mockup `mockups/dashboard-provider.html:198-226`. Isla `client:visible` para abrir modal y refrescar.
- [ ] **T5** Componente `src/components/dashboard/provider/ServiceItem.astro` con prop `service`. Mockup `mockups/dashboard-provider.html:205-214`. Atenuado si `status === 'inactive'`.
- [ ] **T6** Componente `src/components/dashboard/provider/ServiceModal.astro` con props `{mode: 'create' | 'edit', service?}`. Mockup `mockups/dashboard-provider.html:470-508`. Isla con form y validación.
- [ ] **T7** Integrar `ServicesSection` en `dashboard-provider.astro` bajo anchor `#servicios`. Pasar servicios desde SSR (REQ-05 endpoint GET).
- [ ] **T8** Helper compartido `formatCLP(amount)` (si no existe) en `src/lib/utils/format.ts`. Reusado en `ServiceItem` y `ServiceModal`.
- [ ] **T9** Tests:
  - [ ] `tests/unit/validators/services.test.ts` — precios negativos rechazados, nombres vacíos rechazados.
  - [ ] `tests/integration/providers/services-crud.test.ts` — CRUD completo, prestador A no toca servicios de B, toggle status persiste.
  - [ ] `tests/e2e/provider-services-section.spec.ts` — crear → ver en lista → editar → toggle inactivo → verificar atenuado → eliminar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `updateService`, eliminar la verificación de ownership → test integración con prestador B editando servicio de A devuelve 200 → restaurar
- [ ] Sabotaje 2: hacer que `deleteService` haga soft-delete (no hard) → test integración que verifica filas huérfanas falla → restaurar (o documentar la política)
- [ ] Coverage ≥ 90 % en `src/lib/services/services.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: sección servicios en dashboard prestador` y push