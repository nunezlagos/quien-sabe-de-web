# Propuesta — HU-20.3 — Reenviar email de verificación con rate limit

**Estado:** propuesta | **REQ padre:** REQ-20-verificacion-email-post-registro

## Contexto

Algunos usuarios no reciben el primer correo (spam, demora SES, error de tipeo de email seguido de cambio). Esta HU les da una vía explícita para pedir un nuevo envío sin abrir tickets, protegida con rate limit estricto (1 por 5 min, 5 por día) para no convertirse en vector de spam. Habilita el camino de salida del estado bloqueado por HU-20.4 y refuerza OE1.

## Mockups de referencia

- `mockups/verify-email.html:82-84` — botón "Reenviar email" en estado Expirado; es el principal disparador desde la landing del link caducado.
- `mockups/dashboard-user.html:29-39` — bloque hero "¡Hola, Vecino!"; encima va el banner amarillo de HU-20.4 que también ofrece botón "Reenviar".
- `mockups/verify-email.html:85` — copy "Si el problema persiste, contáctanos" como fallback cuando se llega al límite diario.

## Alternativas consideradas

### Opción A — Endpoint POST autenticado con rate limit en KV
- `POST /api/v1/auth/verify-email/resend` exige sesión (cookie KV) y aplica rate limit por `user_id`.
- Pro: trazabilidad clara, evita abuso anónimo, alinea con la arquitectura de sesión.
- Contra: usuario que cerró sesión necesita re-loguear primero para reenviar.

### Opción B — Endpoint público con rate limit por email + captcha
- Acepta `{ email }` sin sesión y aplica rate limit por email + IP + captcha.
- Pro: no exige login.
- Contra: superficie de abuso (enumeración de emails registrados), captcha externo agrega dependencia, complica el flujo simple del happy path.

### Opción C — Reenvío automático cada N minutos si no se verifica
- Cron job que reenvía a usuarios pendientes hasta N intentos.
- Pro: cero acción del usuario.
- Contra: alto riesgo de marcar el dominio como spammer, no controla la intención del usuario, infra extra (Cron Triggers).

## Decisión

Se elige **Opción A**. El proyecto ya tiene cookie de sesión vía KV, así que exigir sesión es trivial y blinda contra enumeración. Para el caso "perdí el link y cerré sesión", el usuario simplemente vuelve a iniciar sesión (la verificación NO es requisito para login según el riesgo declarado en `req.md:73-74`) y luego reenvía.

## Riesgos y mitigaciones

- Riesgo: bombardear el inbox del usuario. Mitigación: rate limit 1 por 5 min Y 5 por día, contador en KV con TTL 24 h.
- Riesgo: token anterior queda activo y permite verificación cruzada. Mitigación: borrar `email_verify:<token_anterior>` (vía `email_verify_user:<user_id>`) antes de emitir el nuevo.
- Riesgo: contador de rate limit pierde sincronía si KV es eventually consistent. Mitigación: aceptar margen de ±1 evento, no es crítico para seguridad.
- Riesgo: usuario ya verificado vuelve a pedir reenvío (rebote del banner cacheado). Mitigación: responder 409 explícito y dejar que la UI refresque el estado.

## Métrica de éxito

- Tasa de reenvíos exitosos (202) sobre solicitudes ≥ 90% (descontando 409 y 429 legítimos).
- 0 incidentes de un mismo usuario recibiendo > 5 correos de verificación en 24 h.
- Tiempo p95 del endpoint < 200 ms (sin contar entrega SMTP).
