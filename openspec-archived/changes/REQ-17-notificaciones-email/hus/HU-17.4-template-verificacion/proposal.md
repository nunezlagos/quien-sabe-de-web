# Propuesta — HU-17.4 — Templates de verificación aprobada/rechazada

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Cuando un admin aprueba o rechaza la verificación de un prestador (REQ-03),
el prestador debe recibir un email告知ndole el resultado. En el caso de
rechazo, el cuerpo debe incluir el `reason` provisto por el admin. Esta HU
define los templates `verification_approved` y `verification_rejected`, y
los engancha en la transición de estado de la verificación (máquina de
estados de REQ-03.5) para que el email se envíe sin que el handler del
admin tenga que recordarlo.

## Mockups de referencia

No aplica. Templates HTML internos.

## Alternativas consideradas

### Opcion A — Hook en la transición de estado, no en el handler admin
- `verification_transitions.ts` (servicio de REQ-03) emite un evento o
  llama directamente `EmailService.send(...)` según `to_status`.
- Pro: el handler admin queda limpio; cualquier futuro path que cambie
  estado dispara el email.
- Contra: acopla REQ-03 a REQ-17; mitigable pasando `emailService` como
  dependencia inyectada.

### Opcion B — Envío explícito desde el handler admin
- `PUT /api/v1/admin/verifications/:id/approve` llama `EmailService.send` después del UPDATE.
- Pro: control explícito, fácil de leer.
- Contra: si se agrega otro path de transición (e.g. script CLI), se olvida el envío.

### Opcion C — Cola async (Cloudflare Queues)
- Encolar el evento "verification.decided" y un worker dedicado lo procesa.
- Pro: resiliencia, retry automático.
- Contra: sobre-ingeniería para un email transaccional; considerar solo si la latencia de Mailpit/SES fuera un problema.

## Decision

Se elige **Opcion A**. La transición de estado es el lugar natural; el
servicio `verification_transitions` recibe `emailService` por DI y llama
`send` cuando corresponde. Esto respeta el principio de "side-effects
centralizados en la transición de estado".

## Riesgos y mitigaciones

- Riesgo: si el email falla, la transición de estado se aborta → Mitigación: el `logEmail` y `EmailService.send` están diseñados fire-and-forget (HU-17.2); el try/catch del handler aísla.
- Riesgo: el `reason` puede ser texto muy largo y romper el template → Mitigación: Zod limita `reason` a 500 chars; el template HTML lo renderiza dentro de un `<p>` con `escapeHtml`.
- Riesgo: emails se envían a direcciones bouncing y AWS bloquea la cuenta → Mitigación: fuera de scope (SES bounce/complaint handling); el REQ-03 puede agregar un check previo si los bounces se acumulan.

## Metrica de exito

- Admin aprueba verificación → prestador recibe `verification_approved`.
- Admin rechaza con `reason="documentos ilegibles"` → prestador recibe `verification_rejected` con el `reason` en el cuerpo.
- Test integración cubre ambos paths y verifica que la fila en `email_log` tiene el `template` correcto.
