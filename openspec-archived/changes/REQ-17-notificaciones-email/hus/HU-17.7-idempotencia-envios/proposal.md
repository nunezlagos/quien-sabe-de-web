# Propuesta — HU-17.7 — Idempotencia (template, recipient, entity)

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Algunos emails no deben duplicarse: bienvenida tras registro, recibo de
donación tras aprobación, re-aceptación de términos. Si un job o un retry
dispara el mismo envío, queremos detectarlo y hacer no-op. La clave de
deduplicación es `(template, recipient, related_entity)` para envíos con
entidad; los envíos sin `related_entity` (e.g. newsletter manual) son
opt-in y se permiten duplicar. La implementación usa un índice único
**parcial** sobre `email_log` que solo aplica a filas con
`status='sent'` y `related_entity IS NOT NULL`, de modo que un retry tras
un fallo (status='failed') sí pueda reintentar.

## Mockups de referencia

No aplica. Backend puro.

## Alternativas consideradas

### Opcion A — Índice único parcial en `email_log`
- Drizzle: `CREATE UNIQUE INDEX ... ON email_log(template, recipient, related_entity) WHERE status='sent' AND related_entity IS NOT NULL`.
- `EmailService.send` consulta `email_log` antes de invocar el adapter: si existe fila con esa key y `status='sent'`, retorna `{ status:'skipped', reason:'duplicate' }` sin tocar el adapter.
- Pro: enforcement a nivel DB, no se puede bypassear por bug de aplicación.
- Pro: el partial WHERE permite reintentar fallos.
- Contra: requiere un SELECT antes de cada send (mitigar con cache KV 5 min si la latencia fuera problema).

### Opcion B — Lock KV por clave
- Antes de enviar, `KV.get('email-lock:welcome:user:42')`; si existe, skip.
- Pro: lock distribuido natural.
- Contra: KV no es la fuente de verdad; el lock puede expirar; debugging más opaco.

### Opcion C — Memoria en proceso (Map)
- Cache local por proceso.
- Contra: en Cloudflare Workers cada request puede ser un isolate distinto; no funciona.

## Decision

Se elige **Opcion A**. El índice único parcial es la solución correcta: la
constraint vive en D1, no depende de cache, y el partial WHERE es la
manera estándar de permitir reintentos tras fallo. El `SELECT` previo es
trivial (índice cubre) y se omite solo si la latencia fuera inaceptable
(medir antes de optimizar).

## Riesgos y mitigaciones

- Riesgo: el SELECT previo agrega latencia → Mitigación: medir; si supera 5ms, mover a cache KV 5 min en HU aparte.
- Riesgo: dos requests concurrentes con misma key pasan el SELECT y los dos envían → Mitigación: el índice único a nivel DB rechaza el segundo INSERT con UNIQUE violation; el segundo request captura y trata como skipped.
- Riesgo: el partial WHERE con SQLite difiere del de PostgreSQL → Mitigación: D1 es SQLite; verificar que `CREATE UNIQUE INDEX ... WHERE` está soportado en la versión usada.

## Metrica de exito

- Segundo `EmailService.send` con misma `(template, recipient, relatedEntity)` retorna `{ status:'skipped', reason:'duplicate' }` sin invocar el adapter.
- Retry tras `status='failed'` se procesa normalmente (el partial WHERE excluye failed).
- `EmailService.send` sin `relatedEntity` no consulta y siempre envía.
- Test integración verifica el constraint UNIQUE parcial y la lógica de skip.
