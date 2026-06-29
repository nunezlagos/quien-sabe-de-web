# HU-05.4 — Reordenar servicios con drag and drop

**Estado:** planned → ready
**Prioridad:** P2
**REQ padre:** REQ-05-catalogo-servicios
**Rama:** `feat/HU-05.4-reorder-drag-drop`

## Tareas tecnicas

- [ ] **T1** Definir `serviceReorderSchema` en `src/lib/validators/services.ts`.
- [ ] **T2** Servicio `reorderServices(db, providerId, newOrder)` en `src/lib/services/services.ts` — transacción Drizzle con N updates. Usar `BEGIN IMMEDIATE` para serializar contra INSERTs concurrentes.
- [ ] **T3** Endpoint `src/pages/api/v1/providers/me/services/reorder.ts` (POST). Validar sesión + Zod + ownership + completitud.
- [ ] **T4** Componente `src/components/dashboard/provider/SortableServiceItem.astro` con handle visual `ri-drag-move-2-line`, botones "Mover arriba"/"Mover abajo" para accesibilidad con teclado, `data-service-id`.
- [ ] **T5** Componente `src/components/dashboard/provider/ServicesList.astro` que orquesta el drag-drop (librería a definir: `SortableJS` o `@atlaskit/pragmatic-drag-drop`).
- [ ] **T6** Botón "Guardar orden" que recolecta el estado local y hace POST a `/reorder`.
- [ ] **T7** Tests:
  - [ ] `tests/unit/validators/services.test.ts` (extender) — `serviceReorderSchema` rechaza vacío, IDs inválidos, duplicados.
  - [ ] `tests/integration/services/reorder.test.ts` — happy path 3 servicios; id ajeno 403; array incompleto 422; idempotencia.
  - [ ] `tests/e2e/services-reorder.spec.ts` — Playwright drag-drop o keyboard reorder + reload + verificar persistencia.

## Sabotaje (a verificar antes de declarar DoD)

- [ ] **S1** Cambiar el endpoint para NO usar transacción (N updates sueltos) → `tests/integration/services/reorder.test.ts` con spy sobre estado intermedio debe caer → restaurar.
- [ ] **S2** Quitar la validación de completitud (`order.length === servicesByProvider.length`) → enviar `[7]` para 3 servicios debe pasar a 200, romper test 422 → restaurar.
- [ ] **S3** Quitar la validación de ownership (`id IN (...) AND provider_id = ?`) → enviar IDs ajenos debe pasar a 200, romper test 403 → restaurar.

## Definition of done

- [ ] Tests `docker exec quien-sabe-app bunx vitest run` → verde
- [ ] Tests Playwright `tests/e2e/services-reorder.spec.ts` → verde
- [ ] Sabotajes S1, S2, S3 confirmados (test rojo verificable) y restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/services.ts` (rama reorder)
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
