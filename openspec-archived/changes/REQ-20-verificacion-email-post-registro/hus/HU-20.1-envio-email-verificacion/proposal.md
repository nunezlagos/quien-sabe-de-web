# Propuesta — HU-20.1 — Envío automático de email de verificación al registrar

**Estado:** propuesta | **REQ padre:** REQ-20-verificacion-email-post-registro

## Contexto

Al cerrar el registro (REQ-02) el sistema necesita validar que el correo informado es real y pertenece al usuario. Esta HU dispara automáticamente el envío del email de verificación apenas se crea la cuenta, dejando rastro auditable (`email_log`) y un token efímero en KV. Aporta al OE1 (confianza vecinal) al asegurar identidad mínima antes de habilitar acciones críticas.

## Mockups de referencia

- `mockups/verify-email.html:42-89` — landing destino del link incluido en el email (estados Verificando / Éxito / Expirado). El cuerpo del correo apunta a la URL pública `/verify-email/<token>` que renderiza esta pantalla.
- `mockups/verify-email.html:33-38` — branding "QuiénSabe" + "Volver al inicio" usados también en el header del template HTML del correo.
- Nota: esta HU es 100% backend; los mockups citados sirven para fijar el dominio visual del link enviado y el branding del email.

## Alternativas consideradas

### Opción A — Hook sincrónico dentro del handler de registro
- Tras `INSERT INTO users` y antes de responder 201, invocar `sendVerificationEmail()` en el mismo request.
- Pro: simple, sin infraestructura extra, falla visible en logs del request.
- Contra: si SES/Mailpit tarda, suma latencia al registro y puede romper la respuesta si lanza excepción no capturada.

### Opción B — Cola asíncrona vía Cloudflare Queues / `ctx.waitUntil`
- Encolar evento `user.registered` y procesarlo en un consumer separado.
- Pro: registro responde rápido, reintentos nativos, mejor para picos.
- Contra: infraestructura adicional (Queue binding), complejidad de testing y observabilidad para una HU P0 sin antecedentes en el proyecto.

### Opción C — Hook sincrónico envuelto en `ctx.waitUntil`
- Generar token + escribir `email_log` sincrónico; entregar a SES dentro de `ctx.waitUntil` para no bloquear la respuesta.
- Pro: latencia baja en el registro, persistencia auditable garantizada, reintento manual posible vía HU-20.3.
- Contra: el resultado del envío SMTP no llega al request original (se loguea aparte).

## Decisión

Se elige **Opción C**. Mantiene la simplicidad de la Opción A pero quita la latencia del envío externo del happy path del registro. Encaja con el adapter `@astrojs/cloudflare` que ya expone `ctx.waitUntil` y no introduce nuevos bindings.

## Riesgos y mitigaciones

- Riesgo: SES/Mailpit caído al momento del registro → email nunca llega. Mitigación: registrar fila `email_log` con estado `pending` y permitir reenvío manual (HU-20.3); alerta operativa si > N pendientes.
- Riesgo: token KV con colisión hipotética → cuenta apropiada. Mitigación: generar 32 bytes hex con `crypto.getRandomValues` y validar inexistencia previa en KV antes de set.
- Riesgo: doble envío si el cliente reintenta registro tras timeout parcial. Mitigación: reusar token vigente en KV si existe para ese `user_id` (clave secundaria `email_verify_user:<user_id>`).

## Métrica de éxito

- 100% de registros exitosos generan una fila `email_log` con `type='email_verify'`.
- Mailpit muestra el correo en `http://localhost:8025` dentro de los 10 s del registro en entorno local.
- Token de 32 bytes hex (64 caracteres) visible en el link del cuerpo.
