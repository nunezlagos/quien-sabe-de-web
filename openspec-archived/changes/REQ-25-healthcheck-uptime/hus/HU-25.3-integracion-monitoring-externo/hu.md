# HU-25.3 — Integración UptimeRobot + alertas

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-25-healthcheck-uptime

## Historia de usuario

**Como** equipo
**Quiero** ser alertado cuando /health falle
**Para** reaccionar rápido a incidentes

## Criterios de aceptación (Gherkin)

### Escenario: UptimeRobot configurado
  Cuando ingreso al panel de UptimeRobot
  Entonces existe monitor HTTPS a `https://<prod-domain>/api/v1/health` cada 5 min
  Y otro al staging cada 15 min

### Escenario: Alerta tras 2 fallos consecutivos
  Cuando /health devuelve 5xx 2 veces seguidas
  Entonces se dispara notificación a Discord webhook y email del equipo

### Escenario: Documentación de runbook
  Cuando reviso `docs/runbook.md` (a crear)
  Entonces existen pasos de triage por componente

### Escenario: Status page público
  Cuando ingreso a `https://status.<dominio>` (status page de UptimeRobot)
  Entonces veo estado histórico de los últimos 90 días

## Tareas técnicas

- [ ] Configuración manual UptimeRobot (documentada en `docs/runbook.md`)
- [ ] Discord webhook + email destino registrados en password manager del equipo
- [ ] Página de status pública linkeada desde footer (extender footer de `mockups/dashboard-user.html:155-159`)
- [ ] Tests N/A (integración externa); validar manualmente con incidente sintético

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
