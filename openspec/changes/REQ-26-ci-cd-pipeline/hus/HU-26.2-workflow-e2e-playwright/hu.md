# HU-26.2 — Workflow E2E Playwright en PR

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-26-ci-cd-pipeline

## Historia de usuario

**Como** equipo
**Quiero** correr E2E Playwright en cada PR
**Para** detectar regresiones de UI/flow

## Criterios de aceptación (Gherkin)

### Escenario: E2E corre con MinIO + Mailpit
  Cuando se ejecuta el workflow
  Entonces se levantan servicios docker (MinIO, Mailpit, Worker dev) en el runner

### Escenario: Playwright trace en fallo
  Cuando un test falla
  Entonces el artifact incluye `trace.zip` y screenshots descargables

### Escenario: Headless por default
  Cuando se ejecuta CI
  Entonces Playwright corre con `--headed=false`

### Escenario: Verificar flujo crear-trade end-to-end
  Cuando corre `tests/e2e/create-trade-flow.spec.ts`
  Entonces el workflow valida portado fiel del mockup `mockups/create-trade.html`

## Tareas técnicas

- [ ] Archivo `.github/workflows/e2e.yml`
- [ ] Compose dev levantado con `docker compose -f docker-compose.dev.yml up -d`
- [ ] Upload artifact `playwright-report/` y `test-results/`
- [ ] Configurar `playwright.config.ts` con `baseURL=http://localhost:4323`
- [ ] Tests: PR de prueba con regresión visual

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
