# HU-26.1 — Workflow CI en pull request

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-26-ci-cd-pipeline

## Historia de usuario

**Como** equipo
**Quiero** que cada PR pase lint, tsc y tests antes de merge
**Para** mantener la calidad del repositorio

## Criterios de aceptación (Gherkin)

### Escenario: PR sano pasa los checks
  Cuando abro PR con código que compila y tests verdes
  Entonces los checks `ci/lint`, `ci/typecheck`, `ci/test-unit`, `ci/test-integration` aparecen verdes

### Escenario: Romper tsc bloquea merge
  Cuando push de cambio que rompe tipos
  Entonces `ci/typecheck` rojo y merge bloqueado por branch protection

### Escenario: Tiempo total < 5 min
  Cuando mido el run
  Entonces el job total termina en menos de 5 minutos en cold cache

### Escenario: D1 local en CI
  Cuando los tests integración corren
  Entonces se usa `wrangler d1 execute --local` con migraciones aplicadas al inicio del job

## Tareas técnicas

- [ ] Archivo `.github/workflows/ci.yml` con matrix Node + Bun
- [ ] Jobs: lint (`bun run lint`), typecheck (`bunx tsc --noEmit`), test-unit (`bun run test:unit`), test-integration (`bun run test:integration`)
- [ ] Cache de `node_modules` + bun cache
- [ ] Branch protection en GitHub configurado para requerir checks
- [ ] Tests: PR de prueba con cambio que rompe tsc para validar bloqueo

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
