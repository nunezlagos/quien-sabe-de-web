# HU-21.2 — Selector de oficio y multi-comuna

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-21-onboarding-prestador
**Rama:** `feat/HU-21.2-captura-oficio-comuna`

## Tareas técnicas

- [ ] **T1** Agregar tabla `providerCommunes` en `src/database/schema.ts` con PK compuesta `(providerId, communeId)`, FK cascade a `providers` y FK restrict a `communes`. Índice secundario `idx_provider_communes_commune` en `communeId`.
- [ ] **T2** Crear seed `src/database/seeds/trades.ts` con `TRADES_SEED` (7 oficios de `mockups/js/data.js:2-10`) y `src/database/seeds/communes.ts` con `COMMUNES_SEED_MIN` (14 comunas de `mockups/js/data.js:12-16`). Exportar ambos con tipos readonly.
- [ ] **T3** Crear migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_provider_communes.sql` con `CREATE TABLE provider_communes` (PK, FKs, índice).
- [ ] **T4** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio` que la tabla existe.
- [ ] **T5** Servicio `src/lib/services/catalog/index.ts` con `listTrades(env)` y `listCommunes(env)` (queries Drizzle, `ORDER BY name ASC`).
- [ ] **T6** Servicio `src/lib/services/catalog/coverage.ts` con `assignCommunesToProvider(env, providerId, communeIds)` (INSERT bulk) y `getProviderCommunes(env, providerId)`.
- [ ] **T7** Endpoint `src/pages/api/v1/catalog/trades.ts` (GET, público) que responde JSON con `Cache-Control: public, max-age=3600`.
- [ ] **T8** Endpoint `src/pages/api/v1/catalog/communes.ts` (GET, público) análogo.
- [ ] **T9** Componente `src/components/onboarding/MultiCommuneSelector.astro` con props `{communes: Array<{id, name}>}`. Grid `grid-cols-2 md:grid-cols-3` con checkboxes `name="communeIds[]"`. Listener JS que actualiza contador `#commune-count` y bloquea submit si count === 0.
- [ ] **T10** Integrar `<MultiCommuneSelector slot="cobertura" />` en `src/pages/create-trade.astro` dentro de `<ProviderWizard>` (slot definido en HU-21.1).
- [ ] **T11** Manejo de "Otro" en el select de oficio: cuando `tradeId === "otro"`, mostrar input adicional `name="tradePendingApproval"` con `class="hidden"` que se toggle con JS.
- [ ] **T12** Tests:
  - [ ] `tests/integration/catalog/trades.test.ts` — `listTrades` devuelve 7 oficios ordenados alfabéticamente.
  - [ ] `tests/integration/catalog/communes.test.ts` — `listCommunes` devuelve ≥14 comunas con headers `Cache-Control`.
  - [ ] `tests/integration/onboarding/provider-communes.test.ts` — `assignCommunesToProvider` inserta 3 filas; intento de duplicar `(provider, commune)` falla por PK; FK cascade borra filas al borrar `provider`.
  - [ ] `tests/e2e/create-trade-communes.spec.ts` — wizard muestra selector, submit con 0 comunas bloqueado, submit con 3 genera 3 filas en `provider_communes`.
  - [ ] Sabotaje 1: en `MultiCommuneSelector.astro`, eliminar el listener JS que cuenta checks → submit con 0 comunas pasa al servidor → test de validación Zod del HU-21.3 lo detecta → restaurar.
  - [ ] Sabotaje 2: en la migración, olvidar el `PRIMARY KEY (provider_id, commune_id)` → segundo insert del mismo par crea duplicado → test integración rojo → restaurar.
  - [ ] Sabotaje 3: en `assignCommunesToProvider`, no usar transacción → ante fallo en INSERT 2/3 quedan filas huérfanas → test integración con INSERT 3 inválido rojo → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/catalog/`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: selector oficio y multi-comuna en wizard` y push a rama (no merge a main)