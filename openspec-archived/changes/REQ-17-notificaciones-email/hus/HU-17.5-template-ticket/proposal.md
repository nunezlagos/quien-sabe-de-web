# Propuesta — HU-17.5 — Template de cambio de estado de ticket

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Los tickets (REQ-10) son reportes o solicitudes de soporte. Cuando cambian
de estado, el solicitante debe recibir un email para mantenerse informado
sin tener que entrar al dashboard. Esta HU cubre dos transiciones: a
`en_revision` (template `ticket_in_review`) y al cierre (template
`ticket_closed`) con un resumen y un CTA "responder por email". El
disparador es la transición de estado del ticket, no el handler, igual que
en HU-17.4.

## Mockups de referencia

No aplica. Templates HTML internos.

## Alternativas consideradas

### Opcion A — Hook en `ticket_transitions.ts` con DI
- `src/lib/services/tickets/transitions.ts` recibe `emailService` y emite el email según `to_status`.
- Pro: consistente con HU-17.4; centraliza side-effects.
- Contra: REQ-10 puede no tener el servicio de transiciones; si no existe, se crea en esta HU.

### Opcion B — Email solo al cierre (no en cada cambio)
- Menos emails, menos ruido.
- Contra: el solicitante queda a ciegas entre apertura y cierre; UX peor. REQ-10 dice "en cada cambio".

### Opcion C — Notificación in-app en vez de email
- Pro: 0 costo de email.
- Contra: el usuario puede no estar logueado; REQ-10 lo define como email explícitamente.

## Decision

Se elige **Opcion A**. Se replica el patrón de HU-17.4: hook en la
transición de estado. Si `ticket_transitions.ts` no existe como servicio
separado, se crea como parte de esta HU o se coordina con REQ-10.

## Riesgos y mitigaciones

- Riesgo: el solicitante no tiene email registrado → Mitigación: REQ-10 garantiza `requester_email` en tickets anónimos; si falta, no se envía (test cubre el skip).
- Riesgo: el "responder por email" usa un `mailto:` con subject pre-llenado que puede ser ignorado por clientes → Mitigación: el CTA es best-effort; documentar que el flujo principal es la plataforma, no el reply.
- Riesgo: el template `ticket_closed` muestra un resumen muy largo → Mitigación: el resumen son los últimos N comments (default 5), truncados a 280 chars cada uno con Zod.

## Metrica de exito

- Ticket pasa a `en_revision` → solicitante recibe `ticket_in_review`.
- Ticket se cierra → solicitante recibe `ticket_closed` con resumen y CTA.
- Si ticket no tiene `requester_email`, no se envía (test verifica fila ausente en `email_log`).
