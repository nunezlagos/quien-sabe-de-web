# HU-26.3 — Deploy automático a staging tras merge main

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-26-ci-cd-pipeline

## Historia de usuario

**Como** equipo
**Quiero** que cada merge a main despliegue a staging
**Para** validar en entorno real antes de prod

## Criterios de aceptación (Gherkin)

### Escenario: Push main dispara deploy
  Cuando se hace merge a `main`
  Entonces `wrangler deploy --env staging` corre exitosamente
  Y el worker staging queda con el sha del commit

### Escenario: Migraciones D1 staging antes del deploy
  Cuando hay migraciones nuevas
  Entonces `wrangler d1 migrations apply DB --env staging` corre antes de `deploy`

### Escenario: Falla migración → rollback
  Cuando migración falla
  Entonces el deploy se aborta y se notifica al canal Discord

### Escenario: Smoke test post-deploy
  Cuando termina deploy
  Entonces se ejecuta curl a `/api/v1/health` esperando 200

## Tareas técnicas

- [ ] Archivo `.github/workflows/deploy-staging.yml` con `on: push: branches: [main]`
- [ ] Pasos: migraciones → deploy → smoke test
- [ ] Secret `CLOUDFLARE_API_TOKEN` con scopes mínimos (Workers + D1)
- [ ] Notificación Discord vía action oficial
- [ ] Tests: ejecutar workflow manualmente con `workflow_dispatch` la primera vez

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
