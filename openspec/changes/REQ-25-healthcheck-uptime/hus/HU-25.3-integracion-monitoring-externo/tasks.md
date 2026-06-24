# HU-25.3 — Integración UptimeRobot + alertas

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-25-healthcheck-uptime
**Rama:** `feat/HU-25.3-integracion-monitoring-externo`

## Tareas técnicas

- [ ] **T1** Crear `docs/runbook.md` con secciones: Health endpoints, Alertas, Triage por componente (D1, KV, R2, SES), Procedimiento de incidente sintético.
- [ ] **T2** Crear `docs/uptimerobot-setup.md` con pasos detallados para configurar UptimeRobot: crear cuenta, add monitor prod (5 min), add monitor staging (15 min), alert contacts (Discord + email), public status page con custom domain.
- [ ] **T3] Configurar manualmente UptimeRobot (operación externa al repo):
  - Monitor prod `https://quiensabe.cl/api/v1/health` cada 5 min.
  - Monitor staging `https://staging.quiensabe.cl/api/v1/health` cada 15 min.
  - Alert contact Discord webhook (URL guardada en 1Password).
  - Alert contact email `alerts@quiensabe.cl`.
  - Trigger condition: 2 fallos consecutivos.
- [ ] **T4] Configurar DNS: agregar CNAME `status.quiensabe.cl` → `status.uptimerobot.com`. Documentar TTL y propagación esperada.
- [ ] **T5] Agregar link "Estado del servicio" en `src/components/layout/Footer.astro` con `href="https://status.quiensabe.cl" target="_blank" rel="noopener"` y clases consistentes con otros links del footer.
- [ ] **T6] Documentar incidente sintético en `tests/manual/uptimerobot-incident-sintetico.md` con pasos: cambiar monitor a `https://httpbin.org/status/500`, esperar 2 polls (~10 min), verificar alerta en Discord y email, restaurar monitor a endpoint real.
- [ ] **T7] Ejecutar incidente sintético en staging antes del merge a main; documentar resultados.
- [ ] **T8] Tests:
  - [ ] `tests/unit/components/footer-status-link.test.ts` — verifica que el footer renderizado contiene `<a href="https://status.quiensabe.cl">Estado del servicio</a>`.
  - [ ] Sabotaje 1: en el Footer, olvidar el link a status page → test verifica que el link está presente → restaurar.
  - [ ] Sabotaje 2: en el runbook, no documentar el procedimiento de triage para D1 → QA simula caída de D1 y no encuentra instrucciones → restaurar.
  - [ ] Sabotaje 3: en la config DNS, apuntar `status.quiensabe.cl` a una URL incorrecta → status page inaccesible → test E2E verifica que el link abre la página de UptimeRobot (no error DNS) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Incidente sintético ejecutado en staging; alerta recibida en Discord + email
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage N/A (configuración externa + docs)
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `docs: runbook + setup UptimeRobot + link status` y push a rama (no merge a main)
- [ ] **Pendiente externo**: configuración DNS + UptimeRobot + webhook Discord requieren acceso a dashboards externos; el dev senior los configura siguiendo `docs/uptimerobot-setup.md`.