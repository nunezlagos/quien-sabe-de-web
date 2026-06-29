# HU-17.2 — Tabla email_log para auditoría

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.2-email-log`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `email_log` a `src/database/schema.ts` con columnas, enum `status`, índices `idx_email_log_template_recipient` y `idx_email_log_sent_at`. Generar migración con `bun run db:generate` y aplicar con `db:migrate:local`.
- [ ] **T2** Validador `emailLogQuerySchema` en `src/lib/validators/email.ts` con Zod (limit 1..200 default 50, before opcional, status enum, template string).
- [ ] **T3** Servicio `logEmail(db, row)` en `src/lib/services/email/log.ts` que hace `INSERT` y captura errores logueando con `console.error` (no propaga). Tests cubren el caso "DB falla pero el caller no se entera".
- [ ] **T4** Servicio `listEmailLog(db, q)` en `src/lib/services/email/log-query.ts` que retorna `{ items, nextCursor }` ordenado por `id DESC`. Filtros aplicados con `WHERE` condicional.
- [ ] **T5** Integrar `logEmail` en `src/lib/services/email/EmailService.ts` `send()`: después de invocar el adapter, llamar `logEmail({...})` con `status` según resultado. Mantener la firma `{ id, status }` de HU-17.1.
- [ ] **T6** Endpoint `src/pages/api/v1/admin/email-log.ts` con `GET`, valida query con Zod, verifica `Astro.locals.user.role === 'admin'` (403 si no), llama `listEmailLog`, retorna JSON con cursor.
- [ ] **T7** Tests:
  - [ ] `tests/unit/validators/email.test.ts` (extender) — `emailLogQuerySchema` casos.
  - [ ] `tests/unit/email/log.test.ts` — `logEmail` no propaga error de DB; `listEmailLog` con filtros aplica correctamente.
  - [ ] `tests/integration/email/log.test.ts` — adapter OK → fila `status='sent'`; adapter falla → fila `status='failed'` con `error` poblado; caller no recibe excepción.
  - [ ] `tests/integration/email/log-endpoint.test.ts` — admin OK con paginación cursor; no-admin recibe 403; query `?status=failed` filtra.
- [ ] **T8** Verificar con `make studio` que la tabla `email_log` existe y los índices están creados.

## Sabotajes a confirmar

1. En `logEmail`, hacer que el `INSERT` propague la excepción (`throw e`) → test integración que simula DB caída y verifica que el caller no recibe excepción falla → restaurar.
2. En `EmailService.send`, eliminar la llamada a `logEmail` después del adapter → test integración que cuenta filas en `email_log` después de un envío espera 1 y obtiene 0 → restaurar.
3. En el endpoint, quitar el check de `role === 'admin'` → test integración que llama con un user no-admin espera 403 y recibe 200 → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/email.test.ts tests/unit/email/log.test.ts tests/integration/email/log.test.ts tests/integration/email/log-endpoint.test.ts` → verde
- [ ] Sabotaje 1 confirmado: `throw` reintroducido → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: `logEmail` no llamado → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: sin check de rol → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/email/log.ts`, `log-query.ts`, `EmailService.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: tabla email_log + endpoint admin paginado` y push a rama (no merge a main)
