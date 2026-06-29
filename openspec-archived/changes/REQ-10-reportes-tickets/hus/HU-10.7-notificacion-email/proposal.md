# Propuesta — HU-10.7 — Notificación por email en cada cambio de estado

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

Los solicitantes (autenticados o anónimos) reciben un email cada vez que el estado de su ticket cambia. Esto les permite estar al tanto sin tener que loguearse y revisar. Los templates son específicos por estado (`ticket_in_review`, `ticket_closed`). Si el ticket no tiene email de contacto (caso raro: usuario autenticado sin email válido, aunque el schema lo previene), se loguea warning y no se intenta envío. Esta HU depende de REQ-17 para el `EmailService` y de HU-10.5 para el hook de la transición.

## Mockups de referencia

No aplica (templates HTML de email son assets; mockup TBD para los emails mismos, fuera de scope inmediato).

## Alternativas consideradas

### Opcion A — Hook en la máquina de estados + EmailService con templates
- `validateTransition` retorna `sideEffects: ['email_in_review' | 'email_closed']`.
- `transitionTicket` ejecuta los side effects tras commit exitoso.
- Pro: declarativo; agregar nuevo email = nuevo sideEffect + template.
- Pro: tests unitarios del hook sin tocar email real.
- Contra: requiere REQ-17 listo; si no, esta HU espera.

### Opcion B — Email disparado desde un cron que escanea tickets recientemente cambiados
- Pro: tolerante a fallos (reintento).
- Contra: añade latencia (cron corre cada N min); mala UX.

### Opcion C — Email desde el admin manualmente
- Pro: control total.
- Contra: olvidos; inconsistente.

## Decision

Se elige **Opcion A**. Es la única opción que da feedback inmediato al solicitante y mantiene el código declarativo. REQ-17 es prerequisito; si no está listo, esta HU se implementa pero queda desactivada (feature flag) hasta que REQ-17 esté mergeado.

## Riesgos y mitigaciones

- Riesgo: email rebota y el ticket queda en estado inconsistente → Mitigación: el envío es best-effort post-commit; un rebote no afecta el estado.
- Riesgo: el ticket tiene `contact_email=NULL` y `created_by_user_id` apuntando a un user con email → Mitigación: usar `users.email` como fallback. Si ambos NULL → warning + skip.
- Riesgo: REQ-17 no tiene el template `ticket_in_review` aún → Mitigación: esta HU lo agrega; REQ-17 lo consume.
- Riesgo: el email contiene datos sensibles (nombre del admin, notas internas) → Mitigación: los templates sólo incluyen datos públicos: ticketId, status, subject (no body), link al ticket (si el solicitante está autenticado).

## Metrica de exito

- Ticket con `contact_email='j@e.cl'` se transiciona a `en_revision` → `EmailService.send('ticket_in_review', ...)` invocado una vez.
- Ticket con `contact_email='j@e.cl'` se transiciona a `cerrado` → `EmailService.send('ticket_closed', ...)` invocado una vez.
- Ticket sin email contacto y sin user → no se invoca `EmailService.send`; warning loggeado.
- Tickets autenticados con user.email → envío a `users.email`, no a `contact_email`.
- `email_log` (tabla de REQ-17) contiene las filas de envío.
- Si `EmailService.send` lanza excepción → warning loggeado, ticket sigue en estado nuevo (no rollback).
