# REQ-26-ci-cd-pipeline

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Pipelines de GitHub Actions para PRs (lint + tsc + tests + E2E) y deploys
automatizados a staging (push a `main`) y producción (tag `v*`). Incluye
cron mensual respaldo de reportes (REQ-15) como fallback al cron de
Cloudflare.

## Criterios de éxito

- [ ] PR no se mergea si lint, tsc o tests fallan.
- [ ] Playwright E2E corre headless en CI con servicios dockerizados
      (D1 local, MinIO, Mailpit).
- [ ] Deploy staging automático tras merge a main.
- [ ] Deploy prod requiere tag firmado `v*` y aplica migraciones D1 antes
      del switch.
- [ ] Cron mensual ejecuta job de reportes y notifica al equipo.

## UI

N/A — DevOps.

## Superficie técnica

### Archivos
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-prod.yml`
- `.github/workflows/cron-reports.yml`

### Secrets
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `WRANGLER_ENV_*`.

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-26.1 | workflow-ci-pr | lint + tsc + tests unit/integración | P0 |
| HU-26.2 | workflow-e2e-playwright | Playwright headless | P0 |
| HU-26.3 | workflow-deploy-staging | Push main → staging | P0 |
| HU-26.4 | workflow-deploy-prod | Tag v* → prod + migraciones | P0 |
| HU-26.5 | workflow-cron-mensual-reports | Cron mensual fallback | P1 |

## Tests requeridos

- **Unit:** N/A (CI mismo es el "test").
- **Integración:** validar que workflow falla con cambio que rompe tsc.
- **E2E:** PR de prueba → ver checks rojos/verdes esperados.

## Dependencias

- **Depende de:** REQ-15, REQ-25
- **Habilita a:** —

## Riesgos / suposiciones

- D1 en CI usa `wrangler d1 execute --local`.
- Wrangler deploy requiere `--minify` deshabilitado para sourcemaps.
