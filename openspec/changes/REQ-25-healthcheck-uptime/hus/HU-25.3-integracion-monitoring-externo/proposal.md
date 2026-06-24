# Propuesta — HU-25.3 — Integración UptimeRobot + alertas

**Estado:** propuesta | **REQ padre:** REQ-25-healthcheck-uptime

## Contexto

Los endpoints `/health` y `/ready` de HU-25.1/25.2 no sirven de nada si nadie los monitorea. Esta HU configura UptimeRobot (servicio externo estándar) para hacer polling cada 5 min al endpoint de producción y cada 15 min al de staging, dispara alertas tras 2 fallos consecutivos a Discord + email del equipo, y crea un runbook en `docs/runbook.md` con los pasos de triage por componente.

## Mockups de referencia

- `mockups/dashboard-user.html:117-146` — footer donde se debe exponer link a status page pública `https://status.<dominio>`.

## Alternativas consideradas

### Opción A — UptimeRobot + Discord webhook + email + status page pública
- UptimeRobot (tier gratuito soporta 50 monitors) configurado manualmente con:
  - Monitor HTTPS a `https://<prod>/api/v1/health` cada 5 min, alerta tras 2 fallos.
  - Monitor a `https://<staging>/api/v1/health` cada 15 min.
- Alertas a Discord webhook del equipo + email del DPO.
- Status page pública `https://status.<dominio>` (subdominio brindado por UptimeRobot).
- Runbook en `docs/runbook.md` con árbol de decisión por componente.
- Pro: setup externo, no requiere código nuevo en el Worker.
- Pro: tier gratuito cubre el caso.
- Contra: la configuración es manual y debe documentarse para reproducir.

### Opción B — Solución self-hosted (Prometheus + Grafana + Alertmanager)
- Pro: control total.
- Contra: complejidad operacional; sale del scope MVP. Mejor para escala > 100k requests/segundo.

### Opción C — Cloudflare Analytics + Email Workers
- Pro: ya en el ecosistema.
- Contra: no da status page pública; alertas básicas.

## Decisión

Se elige **Opción A**. Es la solución estándar para aplicaciones pequeñas/medianas, tier gratuito, setup en 30 min, y el status page pública mejora la confianza del usuario.

## Riesgos y mitigaciones

- Riesgo: UptimeRobot rate-limita o bloquea IPs de Cloudflare Workers → Mitigación: el endpoint está en el Worker, no en Workers IPs que hagan polling. UptimeRobot usa sus propias IPs.
- Riesgo: la status page de UptimeRobot requiere dominio custom → Mitigación: configurar `status.quiensabe.cl` (o similar) con CNAME a `status.uptimerobot.com`. Documentar.
- Riesgo: el webhook de Discord se filtra en el repo → Mitigación: el webhook se guarda en `1Password` o similar; el runbook sólo referencia el nombre del secret.

## Métrica de éxito

- UptimeRobot configurado con 2 monitors (prod 5min, staging 15min).
- Alertas tras 2 fallos consecutivos a Discord + email.
- Status page pública accesible y refleja el estado actual.
- Runbook `docs/runbook.md` con secciones por componente.
- Sabotaje: no es automatizable (configuración externa); métrica = check en incidente sintético que el equipo es alertado dentro de 10 min.