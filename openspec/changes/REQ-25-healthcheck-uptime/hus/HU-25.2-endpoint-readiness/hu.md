# HU-25.2 — Endpoint /ready para deploys

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-25-healthcheck-uptime

## Historia de usuario

**Como** pipeline de deploy
**Quiero** distinguir 'app iniciada' de 'lista para tráfico'
**Para** controlar el switch del worker

## Criterios de aceptación (Gherkin)

### Escenario: Tras deploy, /ready 200 cuando migraciones aplicadas
  Cuando deploy termina y migraciones D1 corrieron
  Entonces `GET /api/v1/ready` devuelve 200 con `{ "ready": true, "version": "<sha>" }`

### Escenario: Pre-warmup → 503
  Cuando el worker recién despierta y aún no completó warmup
  Entonces /ready devuelve 503 con `{ "ready": false, "reason": "warmup" }`

### Escenario: Sin migraciones aplicadas → 503
  Cuando se detecta que `drizzle_migrations.last_applied` no coincide con artifact
  Entonces /ready devuelve 503

### Escenario: Diferencia con /health
  Cuando D1 está degraded pero la app aún sirve
  Entonces /health=degraded pero /ready puede ser true (no bloquea tráfico)

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/ready.ts`
- [ ] Helper `checkMigrationsCurrent(env)` en `src/lib/services/health/migrations.ts`
- [ ] Tests `tests/integration/health/ready.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
