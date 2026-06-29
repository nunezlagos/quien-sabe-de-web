# Propuesta — HU-10.2 — Crear ticket público sin sesión

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

Un visitante anónimo debe poder abrir una consulta general sin crear cuenta. El ticket queda sin `created_by_user_id`, con `contact_email` poblado y `kind='consulta'`. Esto es la puerta de entrada universal al soporte. Al crearse, se envía email de confirmación al solicitante (vía REQ-17). El endpoint es público (sin sesión) pero limitado a `kind='consulta'` para evitar abuso de reportes sin identidad.

## Mockups de referencia

- `mockups/profile.html:238-296` — modal "Reportar / Ayuda" (referencia visual del formulario).
- El caso anónimo (sin estar en un perfil) corresponde a un futuro formulario `/help` o `/contact`; mockup TBD.

## Alternativas consideradas

### Opcion A — Endpoint público con rate-limit por IP y validación Zod estricta
- POST `/api/v1/tickets` con rate-limit (10/h por IP) y `kind` restringido a `consulta` para anónimos.
- Pro: alineado con REQ-08 (ya hay `checkAndIncrement` reutilizable).
- Pro: validación Zod rechaza emails inválidos y bodies vacíos antes de tocar DB.
- Contra: el rate-limit requiere KV binding (ya disponible).

### Opcion B — Siempre exigir sesión, sin endpoint público
- Pro: máxima trazabilidad.
- Contra: contradice criterio explícito "visitante anónimo puede crear ticket".

### Opcion C — Captcha obligatorio
- Pro: anti-spam fuerte.
- Contra: añade fricción y un servicio externo (Turnstile/hCaptcha); fuera de scope inmediato.

## Decision

Se elige **Opcion A**. Es la única que cumple el criterio. El rate-limit usa el helper ya disponible en HU-08.2 (reutilización). Si el volumen de abuso crece, se añade captcha (HU futura). El email de confirmación se delega a REQ-17.

## Riesgos y mitigaciones

- Riesgo: abuso vía bots crea tickets vacíos o spam → Mitigación: rate-limit 10/h por IP; Zod rechaza bodies < 1 char o emails inválidos.
- Riesgo: `contact_email` no es deliverable → Mitigación: el email de confirmación puede rebotar; el ticket igual queda creado (la respuesta del admin no depende del email).
- Riesgo: el visitante anónimo intenta `kind='suplantacion'` → Mitigación: Zod + chequeo explícito: si `session === null` y `kind !== 'consulta'` → 403.
- Riesgo: el subject de 4 chars pasa → Mitigación: Zod con `min(5)`.

## Metrica de exito

- POST anónimo `kind=consulta` + email válido + subject ≥ 5 + body ≥ 1 → 201 con ticket `status='abierto'`, `created_by_user_id=NULL`, `contact_email` poblado.
- POST anónimo `kind=suplantacion` → 403 (no autorizado para anónimos).
- POST anónimo sin `contact_email` → 422.
- POST anónimo `subject='hi'` → 422.
- POST anónimo body vacío → 422.
- 11 requests anónimos en <1h desde misma IP → 10 con 201 + 1 con 429.
