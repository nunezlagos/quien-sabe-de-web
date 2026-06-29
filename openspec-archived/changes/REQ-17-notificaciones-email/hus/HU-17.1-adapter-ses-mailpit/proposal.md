# Propuesta — HU-17.1 — EmailService con adapter SES y Mailpit

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

El sistema necesita una única interfaz para enviar emails transaccionales.
En dev usamos Mailpit (SMTP en `mailpit:1025`); en producción, AWS SES vía
SDK. La fábrica debe elegir el adapter correcto según env vars presentes y
los adapters deben implementar la misma interfaz, de modo que el resto del
código (HU-17.3+) consuma `EmailService.send(...)` sin saber qué adapter
está activo. Esto desacopla REQ-17 de la decisión "SES vs SMTP" y permite
test E2E en local con Mailpit sin tocar AWS.

## Mockups de referencia

No aplica. HU 100% backend.

## Alternativas consideradas

### Opcion A — Interfaz `EmailAdapter` + Factory por env
- `EmailAdapter` interface con `send(message)`.
- `SesAdapter` (prod) y `SmtpAdapter` (dev).
- `EmailService.create(env)` retorna el adapter apropiado; en runtime
  también expone `send(template, vars, to)` que combina con el log
  (HU-17.2).
- Pro: testabilidad con mocks de la interfaz; cambio de provider (SendGrid,
  Postmark) sin tocar callers.
- Contra: dos implementaciones a mantener; SMTP adapter usa `nodemailer`
  (~200KB).

### Opcion B — Single SES SDK que en dev apunta al endpoint SMTP de Mailpit
- AWS SDK acepta `endpoint` custom; en dev `http://mailpit:1025` con
  signing desactivado.
- Pro: una sola implementación.
- Contra: hack feo; AWS SDK no habla SMTP; requiere proxy o monkey-patch;
  debugging difícil.

### Opcion C — Usar Cloudflare Email Workers directamente
- Binding `send_email` de Cloudflare con plantilla inline.
- Pro: 0 costo de egress; integración nativa con Workers.
- Contra: solo soporta emails transaccionales simples, no attachments; el
  REQ actual no requiere attachments pero perder flexibilidad a futuro.

## Decision

Se elige **Opcion A**. La interfaz es trivial (`send(message): Promise<{ id,
status }>`) y el adapter SMTP usa `nodemailer` solo en dev (no se bundlea
en prod porque `getSmtpAdapter()` solo se instancia si la env var está
presente). La factory vive en `EmailService.create(env)`.

## Riesgos y mitigaciones

- Riesgo: credenciales SES en dev hacen que el adapter errado se active → Mitigación: la factory exige que `SES_*` esté completo para elegir `SesAdapter`; si falta alguno, fallback a `SmtpAdapter` con log warning.
- Riesgo: `nodemailer` infla el bundle de prod → Mitigación: importar el adapter dinámicamente (`await import('./SmtpAdapter')`) solo en dev; el bundler de Astro/Workers tree-shakea.
- Riesgo: tests integración requieren Mailpit corriendo → Mitigación: el test salta si `SMTP_HOST` no resuelve (skip con `it.skip`), documentado en README.

## Metrica de exito

- `EmailService.create({ SMTP_HOST:'mailpit', SMTP_PORT:'1025' })` retorna instancia de `SmtpAdapter`.
- `EmailService.create({ SES_REGION:'us-east-1', SES_ACCESS_KEY_ID:'...', SES_SECRET_ACCESS_KEY:'...' })` retorna `SesAdapter`.
- Test integración: enviar email a Mailpit, consultar `http://localhost:8025` (UI) o `:8025/api/v1/messages` y confirmar 1 mensaje nuevo.
