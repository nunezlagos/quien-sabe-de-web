# HU-25.2 — Endpoint /ready para deploys

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-25-healthcheck-uptime
**Rama:** `feat/HU-25.2-endpoint-readiness`

## Tareas técnicas

- [ ] **T1** Constante `MIGRATION_ARTIFACT_HASH` calculada en build time:
  - Script `scripts/compute-migration-hash.ts` que hashea `src/database/migrations/*.sql` ordenados con SHA-256.
  - `bun run scripts/compute-migration-hash.ts > src/lib/services/health/migration-artifact.json`.
  - Importar en código: `import artifact from './migration-artifact.json' assert { type: 'json' }`.
- [ ] **T2** Flag global `isReady: boolean = false` en `src/lib/services/health/state.ts`. Helper `markReady()` y `resetReady()` (sólo para tests).
- [ ] **T3** Hook de inicialización: en `src/middleware.ts` (entrypoint Astro), en el primer request, llamar `await runMigrationsIfNeeded(env)` y luego `markReady()`. Usar flag estático para idempotencia.
- [ ] **T4** Servicio `src/lib/services/health/migrations.ts` con `checkMigrationsCurrent(env)`:
  - Query: `SELECT hash, created_at FROM drizzle_migrations ORDER BY created_at DESC LIMIT 1`.
  - Compara con `artifact.hash`.
  - Cache KV `migrations_check:<env>` con TTL 30s.
- [ ] **T5** Servicio `src/lib/services/health/ready.ts` con `runReadinessCheck(env)`:
  - Si `!isReady` → return `{ready: false, reason: 'warmup'}`.
  - Si `!checkMigrationsCurrent(env).current` → return `{ready: false, reason: 'migrations_pending'}`.
  - Else → return `{ready: true, version: BUILD_SHA, migrations_current: true}`.
- [ ] **T6] Endpoint `src/pages/api/v1/ready.ts` (GET, público):
  - Llama `runReadinessCheck(env)`.
  - Header `Cache-Control: no-store`.
  - 200 si `ready: true`; 503 si `ready: false`.
- [ ] **T7] Tests:
  - [ ] `tests/unit/services/ready.test.ts` — `runReadinessCheck` con `isReady=false` retorna `{ready: false, reason: 'warmup'}`; con `isReady=true` + hash coincidente retorna 200; con `isReady=true` + hash distinto retorna 503 `migrations_pending`.
  - [ ] `tests/integration/health/ready.test.ts` — fixture con `drizzle_migrations` última fila hash "abc" + artifact "abc" → 200; artifact "xyz" → 503 `migrations_pending`; D1 probe degradado pero migraciones OK → 200 (diferencia con /health).
  - [ ] Sabotaje 1: en `runReadinessCheck`, olvidar la verificación `checkMigrationsCurrent` → deploy con migración pendiente pasa readiness → test con `lastApplied="abc"` + artifact `"xyz"` espera 503 y recibe 200 → restaurar.
  - [ ] Sabotaje 2: en el endpoint, no usar `Cache-Control: no-store` → pipeline ve respuesta cacheada de deploy previo → test verifica header → restaurar.
  - [ ] Sabotaje 3: en `checkMigrationsCurrent`, no consultar la tabla `drizzle_migrations` y comparar siempre `true` → test verifica que con hash distinto retorna `current: false` → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E (polling) → verde
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/health/ready.ts` y `src/lib/services/health/migrations.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint /ready para deploys` y push a rama (no merge a main)