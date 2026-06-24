# HU-09.6 — Moderación admin: ocultar reseña con motivo

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-09-resenas-rating
**Rama:** `feat/HU-09.6-moderacion-admin`

## Tareas técnicas

- [ ] **T1** Si `admin_audit_log` no existe (REQ-13 no implementado aún), crear tabla mínima en esta migración: `id INTEGER PK, actor_id INTEGER NOT NULL REFERENCES users(id), event TEXT NOT NULL, target_kind TEXT NOT NULL, target_id INTEGER NOT NULL, reason TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch())`. Índice `(event, created_at DESC)`.
- [ ] **T2** Validador `reviewHideSchema` en `src/lib/validators/admin.ts`.
- [ ] **T3** Servicio `recordAdminAudit(env, adminId, event, targetKind, targetId, reason): Promise<void>` en `src/lib/services/admin/audit.ts`.
- [ ] **T4** Servicio `hideReviewAsAdmin(env, reviewId, adminId, reason): Promise<Review>` en `src/lib/services/reviews.ts`:
  - `db.transaction(async (tx) => { ... })`.
  - UPDATE `reviews` SET status='hidden', hidden_reason=:reason WHERE id=:id.
  - INSERT audit log con `event='review_hidden'`.
  - Retornar la fila actualizada.
- [ ] **T5** Endpoint `src/pages/api/v1/admin/reviews/[id]/hide.ts` (PATCH):
  - `requireAdmin(Astro)` → 401 / 403.
  - Validar body con `reviewHideSchema` → 422.
  - `getReviewById` → 404 si null.
  - Try `hideReviewAsAdmin`; capturar errores de transacción.
  - `successResponse({ id, status: 'hidden', hiddenReason: reason }, 200)`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/validators/admin.test.ts` — `reviewHideSchema`: motivo 1..200 OK; vacío falla; 201 chars falla.
  - [ ] `tests/unit/services/reviews.test.ts` (extender) — `hideReviewAsAdmin` cambia status a 'hidden'; reseña ya oculta sigue oculta y el audit se inserta igual (idempotente).
  - [ ] `tests/unit/services/admin/audit.test.ts` — `recordAdminAudit` inserta fila con todos los campos.
  - [ ] `tests/integration/admin/reviews-hide.test.ts` — PATCH admin → 200 + fila en `admin_audit_log`; motivo vacío → 422; sesión vecino → 403; sin sesión → 401; reseña inexistente → 404; reseñas ocultas no aparecen en GET público de HU-07.4; promedio recalculado (verificar con HU-09.5).

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: olvidar `AND status = 'visible'` en la query de HU-07.4 → test "oculta no aparece en GET público" cae → restaurar
- [ ] Sabotaje 2: en `hideReviewAsAdmin`, ejecutar el UPDATE fuera de la transacción (separado del INSERT audit) → simular fallo del INSERT → la reseña queda oculta sin audit log → test "audit log insertado" cae (no por sabotaje directo sino por la naturaleza del fallo; ajustar test para forzar fallo del INSERT y verificar rollback) → restaurar
- [ ] Sabotaje 3: cambiar `event='review_hidden'` por `event='review_hidden_typo'` → test "audit log con event correcto" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/reviews.ts` (rama hide) y `src/lib/services/admin/audit.ts`
- [ ] Type check verde
- [ ] Commit `feat: moderación admin oculta reseña con motivo y audit log` y push
