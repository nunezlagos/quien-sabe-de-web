# HU-17.7 — Idempotencia (template, recipient, entity)

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.7-idempotencia-envios`

## Tareas tecnicas

- [ ] **T1** Verificar versión SQLite de D1 (en local con `bunx wrangler d1 --local info`) soporta partial indexes. Si no, ajustar a índice completo con `status` y adaptar lógica de skip.
- [ ] **T2** Generar migración `00XX_email_log_idempotency.sql` con `CREATE UNIQUE INDEX idx_email_log_idempotency ON email_log(template, recipient, related_entity) WHERE status='sent' AND related_entity IS NOT NULL;`. Aplicar con `db:migrate:local`.
- [ ] **T3** `findSentDuplicate(input)` privado en `EmailService` que hace `SELECT id FROM email_log WHERE template=? AND recipient=? AND related_entity=? AND status='sent' LIMIT 1`. Retorna `boolean`.
- [ ] **T4** Modificar `EmailService.send(input)`:
  - Si `input.relatedEntity` ausente → omitir check, enviar siempre.
  - Si `findSentDuplicate` retorna true → log fila con `status='skipped'`, retornar `{ status:'skipped', reason:'duplicate' }` SIN invocar adapter.
  - Si adapter.send lanza y es `SQLITE_CONSTRAINT_UNIQUE` (race) → tratar como skipped.
  - Resto del flujo (render, send, log) igual que antes.
- [ ] **T5** Tests:
  - [ ] `tests/unit/email/idempotency.test.ts` — `findSentDuplicate` con mock: existe fila `sent` → true; existe solo `failed` → false; sin relatedEntity no se llama al DB.
  - [ ] `tests/unit/email/send-result.test.ts` — mock adapter + mock DB: 4 ramas (con/sin relatedEntity × primer/segundo envío) retornan el `SendResult` correcto.
  - [ ] `tests/integration/email/idempotency.test.ts` — primer send inserta fila `sent`; segundo send retorna `skipped` y no invoca adapter (assert con spy); tras un `failed`, retry envía OK; insert manual SQL de una segunda fila `sent` con misma key viola UNIQUE.
  - [ ] Medir latencia del SELECT previo con `performance.now()`; documentar baseline.
- [ ] **T6** Verificar manualmente: en Mailpit, registrar el mismo usuario dos veces (forzando `relatedEntity: user:42`); confirmar que solo llega 1 email.

## Sabotajes a confirmar

1. En `EmailService.send`, llamar al adapter antes del check de duplicado (orden invertido) → el segundo send llega a Mailpit; test con spy en adapter que cuenta invocaciones espera 1 y recibe 2 → restaurar.
2. Eliminar la cláusula `WHERE status='sent'` del SELECT → un fallo anterior bloquea reintentos; test que verifica "retry tras failed funciona" falla → restaurar.
3. En la migración, cambiar el `WHERE` para que excluya `related_entity IS NOT NULL` (queda `WHERE status='sent'`) → un send sin `relatedEntity` queda afectado; test que verifica "sin relatedEntity no consulta" no falla pero el constraint único se vuelve demasiado estricto (test de doble send con `null` relatedEntity debería pasar y falla) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/email/idempotency.test.ts tests/unit/email/send-result.test.ts tests/integration/email/idempotency.test.ts` → verde
- [ ] Sabotaje 1 confirmado: orden invertido → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: sin `status='sent'` en WHERE → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: WHERE incorrecto → test rojo → restaurar
- [ ] Latencia del SELECT previo documentada (< 10ms p99 en local)
- [ ] Coverage ≥ 90 % en `EmailService.ts` (path de send completo)
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: idempotencia email_log (template, recipient, related_entity)` y push a rama (no merge a main)
