# Propuesta — HU-17.2 — Tabla email_log para auditoría

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Cada envío de email debe quedar registrado para auditoría y debugging. La
tabla `email_log` persiste `template`, `recipient`, `status` (sent / failed
/ skipped), `related_entity` (ej: `user:42`, `donation:10`), `sent_at`,
`error` (si falló) y `provider_id` (Message-ID de SES/SMTP). La fila se
inserta sin interrumpir el flujo de negocio: si el adapter falla, igual
queda registro con `status="failed"` y la operación caller no se entera
(email es fire-and-forget en el sentido de "no romper UX por una falla de
entrega"). Adicionalmente, se expone un endpoint admin paginado para que el
dashboard (REQ-13) pueda listar fallos recientes.

## Mockups de referencia

- `mockups/dashboard-admin.html:67-105` — grilla de KPIs admin; referencia
  visual para tablas de auditoría con paginación.

## Alternativas consideradas

### Opcion A — Tabla `email_log` con index en `(template, recipient, sent_at DESC)` y endpoint admin
- Insert por cada `EmailService.send` (vía wrapper helper `logEmail`).
- Endpoint `GET /api/v1/admin/email-log?limit=50&before=<id>`.
- Pro: filtro por recipient o template eficiente; paginación cursor-based.
- Pro: cumple auditoría con storage barato (D1).
- Contra: tabla crece linealmente con el tráfico de emails; job de purge futuro.

### Opcion B — Solo logs estructurados (Cloudflare Logpush) sin DB
- `console.log` con JSON; Logpush a R2/SIEM.
- Pro: cero costo D1, retención configurable en destino.
- Contra: queries ad-hoc requieren re-importar a un warehouse; admin no puede ver en vivo desde el dashboard sin rehidratar.

### Opcion C — Tabla + retention de 90 días auto
- Misma que A + cron que borra filas > 90 días.
- Pro: tabla acotada.
- Contra: agrega un cron (REQ-18 / REQ-25 territory); fuera de scope; mejor agregarlo en HU aparte si la tabla crece.

## Decision

Se elige **Opcion A**. La tabla es el cimiento de auditoría y debugging; el
endpoint admin cubre la visibilidad que el dashboard necesita. La retention
es decisión futura, no de esta HU.

## Riesgos y mitigaciones

- Riesgo: insert en `email_log` falla y se pierde la fila → Mitigación: si el insert falla, loggear a `console.error` y continuar (no romper el flujo del adapter).
- Riesgo: PII del recipient queda en la tabla → Mitigación: el recipient es email (obligatorio para delivery); el campo `related_entity` es clave opaca, no incluye el contenido del email. Sujeto a Ley 19.628; ver REQ-22.
- Riesgo: el endpoint admin es accessible sin rol → Mitigación: middleware verifica `Astro.locals.user.role === 'admin'`.

## Metrica de exito

- `EmailService.send` registra una fila en `email_log` por cada intento, sea éxito o fallo.
- `status='sent'` cuando adapter retorna OK; `status='failed'` con `error` poblado cuando falla; `status='skipped'` cuando HU-17.7 detecte duplicado.
- `GET /api/v1/admin/email-log?limit=50` retorna máx 50 filas, ordenadas por `sent_at DESC`; cursor `before=<id>` pagina hacia atrás.
- Test integración cubre flujo OK y fallo; verifica que la falla del adapter no interrumpe el caller.
