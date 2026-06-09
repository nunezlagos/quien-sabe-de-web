# HU-26.4 — Deploy a prod con tag v*

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-26-ci-cd-pipeline

## Historia de usuario

**Como** equipo
**Quiero** que sólo tags firmados desplieguen a producción
**Para** prevenir despliegues accidentales

## Criterios de aceptación (Gherkin)

### Escenario: Tag v1.2.3 dispara deploy prod
  Cuando creo y pusheo tag `v1.2.3`
  Entonces el workflow `deploy-prod` se dispara

### Escenario: Tag no firmado rechazado
  Cuando el tag no tiene firma GPG
  Entonces el workflow falla en el step de verificación

### Escenario: Migraciones prod con confirm manual
  Cuando hay migración nueva
  Entonces el workflow requiere `environment: production` approval en GitHub Actions

### Escenario: Rollback documentado
  Cuando deploy falla
  Entonces el runbook indica `wrangler rollback --env production`

## Tareas técnicas

- [ ] Archivo `.github/workflows/deploy-prod.yml` con `on: push: tags: ['v*']`
- [ ] Step verificar firma GPG del tag
- [ ] GitHub Environment `production` con approvals + secrets separados
- [ ] Documentar rollback en `docs/runbook.md`
- [ ] Tests: tag de prueba `v0.0.0-rc1` validando flujo completo

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
