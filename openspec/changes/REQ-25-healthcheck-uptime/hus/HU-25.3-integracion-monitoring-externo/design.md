# Diseño técnico — HU-25.3 — Integración UptimeRobot + alertas

**REQ padre:** REQ-25-healthcheck-uptime

## Modelo de datos

No aplica. Esta HU es configuración externa + documentación.

## Contrato de API

No aplica. Los endpoints de HU-25.1 y HU-25.2 son consumidos desde UptimeRobot (servicio externo), no desde código del Worker.

## Validaciones Zod

No aplica.

## Componentes UI

### Footer global — link a status page
- En `src/components/layout/Footer.astro`, agregar link "Estado del servicio" con `href="https://status.quiensabe.cl"` (o el subdominio configurado), `target="_blank" rel="noopener"`, clases `hover:text-primary transition font-bold text-gray-300 hover:scale-105 transform` (consistente con los otros links del footer).

## Documentación: `docs/runbook.md`

Estructura:
```markdown
# Runbook — Quién Sabe

## Health endpoints
- /api/v1/health (monitoreo externo)
- /api/v1/ready (deploy pipeline)

## Alertas
- Discord: #quien-sabe-alerts (webhook en 1Password, key: UPTIMEROBOT_DISCORD_WEBHOOK)
- Email: alerts@quiensabe.cl (lista del DPO + 2 devs senior)

## Triage por componente

### D1 caído
1. Verificar status.cloudflare.com
2. Si D1 degraded > 5min, abrir incident en Linear
3. Si el endpoint /health retorna `d1.status='down'`, las queries van a fallar; UI muestra mensaje "Servicio en mantenimiento"
4. Contacto de soporte: enterprise-support@cloudflare.com

### KV caído
1. KV es usado por sesiones y rate-limit
2. Si KV cae, los usuarios pierden sesión pero pueden seguir navegando (read-only)
3. Contacto:同上

### R2 caído
1. R2 almacena exports ZIP y fotos de perfil
2. Si R2 cae, las fotos no cargan; export de datos falla
3. UI muestra placeholders

### SES caído
1. SES envía emails transaccionales (REQ-17)
2. Si SES cae, los emails se encolan (no se pierden)
3. Verificar bounce rate > 5%

## Procedimiento de incidente sintético
1. Apuntar UptimeRobot monitor a https://httpbin.org/status/500
2. Esperar 2 polls (~10 min)
3. Verificar alerta en Discord y email
4. Restaurar monitor a endpoint real
```

## Configuración UptimeRobot (manual, fuera del repo)

Documentar en `docs/uptimerobot-setup.md`:
1. Crear cuenta en uptimerobot.com (tier gratuito).
2. Add Monitor → HTTPS → `https://quiensabe.cl/api/v1/health` → interval 5 min.
3. Alert contacts: crear Discord webhook (Server Settings → Integrations → Webhooks), copiar URL.
4. Add Monitor → HTTPS → `https://staging.quiensabe.cl/api/v1/health` → interval 15 min.
5. Status page: Public Status Pages → crear `quiensabe-status` → custom domain `status.quiensabe.cl` con CNAME a `status.uptimerobot.com`.
6. Webhook genérico: Settings → API → Webhook URL → apuntar a Discord.

## Flujo de interacción (secuencial)

### Estado normal
1. UptimeRobot hace `GET /api/v1/health` cada 5 min.
2. Recibe 200 + `{status: "ok"}`.
3. Marca "up".

### Caída
1. UptimeRobot hace `GET /api/v1/health`.
2. Recibe 503 o timeout.
3. Espera al siguiente poll (5 min).
4. Si el segundo también falla → dispara alerta.
5. Webhook a Discord envía mensaje al canal `#quien-sabe-alerts`.
6. Email a `alerts@quiensabe.cl`.
7. Equipo sigue runbook.

### Recuperación
1. Próximo poll exitoso tras la caída.
2. UptimeRobot registra "up".
3. Status page pública refleja el cambio.
4. (No se envía alerta de recuperación por defecto; opcional configurar).

## Capa de servicios

No aplica. No hay código nuevo en el Worker.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Manual | `tests/manual/uptimerobot-incident-sintetico.md` — checklist ejecutado por el equipo: cambiar monitor a endpoint 500; esperar 2 polls; verificar alerta; restaurar. |
| Unit | `tests/unit/components/footer-status-link.test.ts` (opcional) — verificar que el footer contiene `<a href="https://status.quiensabe.cl" target="_blank">Estado del servicio</a>`. |

## Dependencias y secuencia

- **Bloqueado por:** HU-25.1 (endpoint /health debe existir antes de configurar UptimeRobot).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `docs/`, `src/components/layout/Footer.astro`.

## Riesgos técnicos

- Riesgo: el subdominio `status.quiensabe.cl` requiere DNS configurado → Mitigación: documentar el paso en `docs/uptimerobot-setup.md`.
- Riesgo: el webhook de Discord se compromete → Mitigación: rotar el webhook; UptimeRobot permite regenerar URLs.
- Riesgo: el runbook queda desactualizado → Mitigación: revisión trimestral como tarea recurrente del DPO; documentar en `docs/maintenance-calendar.md`.