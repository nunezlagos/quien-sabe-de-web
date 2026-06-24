# HU-22.4 — Eliminar cuenta con soft delete y anonimización

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.4-endpoint-eliminar-cuenta`

## Tareas técnicas

- [ ] **T1** Migración `src/database/migrations/00XX_account_deletion.sql`:
  - `ALTER TABLE users ADD COLUMN deleted_at INTEGER`.
  - `ALTER TABLE users ADD COLUMN anonymized_at INTEGER`.
  - Drop y recrear `idx_users_email_unique` como parcial: `CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL`.
  - `ALTER TABLE reviews ADD COLUMN user_id_display TEXT NOT NULL DEFAULT ''`.
  - Backfill: `UPDATE reviews SET user_id_display = COALESCE(u.display_name, 'Vecino') FROM users u WHERE reviews.user_id = u.id`.
- [ ] **T2** Actualizar `src/database/schema.ts`: agregar `deletedAt`, `anonymizedAt` a `users` y `userIdDisplay` a `reviews`.
- [ ] **T3** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T4** Validador `deleteAccountSchema` en `src/lib/validators/compliance/delete.ts` con `z.literal('ELIMINAR')`.
- [ ] **T5] Servicio `src/lib/services/compliance/delete-account.ts` con `deleteAccount(env, userId)` que ejecuta `db.batch([updateUser, updateReviews, updateProviders, updateConsents])`.
- [ ] **T6** Endpoint `src/pages/api/v1/users/me/index.ts` (DELETE handler):
  - `requireSession` → 401.
  - Parse con `deleteAccountSchema` → 422.
  - Llama `deleteAccount`.
  - Llama `revokeAllSessions(env, userId)` (helper de HU-19.4).
  - Responde 204.
- [ ] **T7** Verificar que el middleware de auth filtra `deleted_at IS NULL`. Si no lo hace, agregar la cláusula en `getSessionUser(env, sessionId)`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/validators/delete-account.test.ts` — schema acepta `{confirm: "ELIMINAR"}`; rechaza `{confirm: "eliminar"}`; rechaza body vacío; rechaza `{confirm: "ELIMINAR "}` con espacio.
  - [ ] `tests/integration/compliance/delete-account.test.ts` — fixture user con provider + 2 reseñas + 1 contacto + sesión KV activa: DELETE devuelve 204; `users.email` = `deleted-<uuid>@quien-sabe.local`; `users.deleted_at` no null; `reviews.user_id_display = "Vecino eliminado"` para ambas reseñas; `providers.status = 'deleted'`; sesión KV borrada (segunda request con cookie devuelve 401); DELETE sin confirm devuelve 422.
  - [ ] Sabotaje 1: en el endpoint, olvidar `revokeAllSessions` → test verifica que la sesión KV sigue activa (request con misma cookie tras DELETE devuelve 200, no 401) → restaurar.
  - [ ] Sabotaje 2: en la migración, olvidar el backfill de `reviews.user_id_display` → reseñas pre-existentes quedan con string vacío `""` visible al público → test verifica que `user_id_display` se llenó (no '') → restaurar.
  - [ ] Sabotaje 3: en `deleteAccount`, olvidar el `UPDATE providers SET status = 'deleted'` → prestador sigue apareciendo en búsqueda → test verifica `providers.status = 'deleted'` post-DELETE → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (flujo completo con modal de confirmación)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/compliance/delete-account.ts` y `src/lib/validators/compliance/delete.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint eliminar cuenta con anonimización` y push a rama (no merge a main)