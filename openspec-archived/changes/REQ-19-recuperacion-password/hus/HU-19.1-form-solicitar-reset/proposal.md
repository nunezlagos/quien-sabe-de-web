# Propuesta — HU-19.1 — Solicitar reset de contraseña por email

**Estado:** propuesta | **REQ padre:** REQ-19-recuperacion-password

## Contexto

Quien olvidó su contraseña debe poder ingresar su email y recibir un link
de reset. Esta HU implementa el endpoint `POST /api/v1/auth/forgot-password`
que (a) genera un token de un solo uso, (b) lo persiste en KV
`pwreset:<token>` con TTL 1800s, (c) encola el email con el link y (d) lo
loguea en `email_log` con `template='password_reset'`. Para evitar
enumeración de usuarios, el endpoint siempre retorna 202, exista o no el
email. Adicionalmente, rate-limit por email (3/h) e IP (5/h) evita abuso.

## Mockups de referencia

- `mockups/forgot-password.html:28-68` — card blanca con input email y CTA
  "Enviar enlace", más el `success-card` que se muestra tras el submit.
  Estilo a replicar: `bg-white rounded-3xl shadow-sm border border-gray-100`
  con ícono `ri-lock-unlock-line` y botón `bg-primary rounded-xl`.

## Alternativas consideradas

### Opcion A — Token en KV con TTL + email via REQ-17
- `generateResetToken()` produce 32 bytes hex; `KV.put('pwreset:<token>', JSON.stringify({ user_id }), { expirationTtl: 1800 })`.
- Email se envía via `EmailService.send({ template:'password_reset', ... })` (de REQ-17).
- Pro: TTL automático, sin cron de limpieza; integración con servicio de email existente.
- Pro: idempotencia de REQ-17 (HU-17.7) evita duplicados si el usuario hace click 2 veces.
- Contra: si KV no está disponible, no hay reset; mitigable con fallback D1 (decisión futura).

### Opcion B — Token en tabla D1 `password_reset_tokens`
- Tabla con `token`, `user_id`, `expires_at`, `used_at`.
- Pro: queryable, auditable con SQL.
- Contra: requiere cron o query de limpieza; TTL en D1 no es automático; el `req.md` ya descarta esta opción.

### Opcion C — JWT firmado con secret rotativo
- Token stateless.
- Pro: 0 storage.
- Contra: revocación inmediata no es posible (compromiso de cuenta requiere esperar expiración); más complejo que KV.

## Decision

Se elige **Opcion A**. KV con TTL es la solución correcta: cero
mantenimiento, revocación natural al pasar 30 min, e idempotencia
componible con HU-17.7.

## Riesgos y mitigaciones

- Riesgo: el token adivinable permite resetear cuenta ajena → Mitigación: 32 bytes hex = 256 bits de entropía, no adivinable; CSPRNG.
- Riesgo: usuario abusa con muchos clicks → Mitigación: rate-limit 3/h por email + 5/h por IP; tests verifican ambos límites.
- Riesgo: el endpoint revela si el email existe (timing attack) → Mitigación: 202 en ambos casos; el delay del SMTP es fire-and-forget; tests verifican que la respuesta es idéntica.

## Metrica de exito

- `POST /api/v1/auth/forgot-password` con email existente → 202, key KV `pwreset:<token>` creada con TTL ≤ 1800, fila en `email_log` con `template='password_reset'`.
- Email inexistente → 202 idéntico, sin fila en `email_log`, sin key KV.
- 4ta request en 1h con mismo email → 429 con `{ error: "demasiadas solicitudes" }`.
- 6ta request en 1h con misma IP → 429.
