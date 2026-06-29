# REQ-17-notificaciones-email

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Emails transaccionales con adapter doble: SES en producción, SMTP Mailpit en
desarrollo. Templates: bienvenida, confirmación de verificación, cambio de
estado de ticket, recibo de donación. Log persistente para auditoría.

## Criterios de éxito

- [ ] Una sola interfaz `EmailService.send(template, vars, to)` independiente del adapter.
- [ ] Dev usa Mailpit (SMTP `mailpit:1025`) automáticamente.
- [ ] Prod usa SES vía AWS SDK con credenciales en Wrangler secret.
- [ ] Cada email queda registrado en `email_log` con status.
- [ ] Templates en HTML + texto plano.
- [ ] Idempotencia por (template, recipient, related_entity_id) — no duplicar.

## Superficie técnica

### Endpoints API
- (Servicio interno consumido por otros REQs)
- `GET /api/v1/admin/email-log?limit=N` — listado paginado de emails enviados [admin]

### Servicios internos
- `src/lib/services/email/EmailService.ts` — interfaz pública
- `src/lib/services/email/SesAdapter.ts` — prod
- `src/lib/services/email/SmtpAdapter.ts` — dev
- `src/lib/services/email/templates/` — render con MJML o JSX-Email

### Tablas Drizzle
- `email_log` (id, template, recipient, status, related_entity, sent_at, error?)

### Bindings Cloudflare
- `SES` (vars de entorno SES_*), `SMTP_HOST` (dev)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-17.1 | adapter-ses-mailpit | Interfaz + dos adapters | P0 |
| HU-17.2 | email-log | Tabla + helper de logging | P0 |
| HU-17.3 | template-bienvenida | Welcome email | P0 |
| HU-17.4 | template-verificacion | Estado verificación (aprobado/rechazado) | P0 |
| HU-17.5 | template-ticket | Cambio de estado ticket | P0 |
| HU-17.6 | template-donacion | Recibo de donación | P0 |
| HU-17.7 | idempotencia-envios | Constraint único por (template, recipient, entity) | P1 |

## Tests requeridos

- **Unit:** renderer de templates con vars (escape de HTML), helper de log.
- **Integración:** envío contra Mailpit en dev (assert via API HTTP de Mailpit `:8025/api/v1/messages`), idempotencia (segunda llamada idéntica → no-op).
- **E2E:** flujo registro → email bienvenida visible en Mailpit UI.

## Dependencias

- **Depende de:** —
- **Habilita a:** REQ-01, REQ-03, REQ-10, REQ-14, REQ-15

## Riesgos / suposiciones

- SES requiere "sandbox out" para enviar a destinos no verificados (trámite AWS).
- Mailpit corre sólo en docker dev; tests E2E asumen presente.
