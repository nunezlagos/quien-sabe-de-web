# HU-22.6 — Auditoría de acceso admin a datos personales

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.6-auditoria-acceso-datos`

## Tareas técnicas

- [ ] **T1** Agregar tabla `dataAccessLog` a `src/database/schema.ts` con PK auto-increment, FKs a `users` (admin_id nullable con set null, user_id not null con cascade), columnas `action` (enum), `accessedAt`, `reason`, `ipHash`. Índices `(user_id, accessed_at)` y `(admin_id, accessed_at)`.
- [ ] **T2** Migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_data_access_log.sql` con `CREATE TABLE data_access_log (...)` e índices.
- [ ] **T3** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T4** Validador `accessReasonSchema` en `src/lib/validators/compliance/audit.ts` con `z.string().trim().min(1).max(500)`.
- [ ] **T5] Servicio `src/lib/services/compliance/audit.ts` con `recordAccess(env, adminId, userId, action, reason?, ip?)` (INSERT async sin await) y `getUserAccessLog(env, userId, limit=50, offset=0)` (LEFT JOIN a `users` para `admin_display_name`).
- [ ] **T6** Middleware `auditAdminAccess(action)` en `src/lib/middleware/audit.ts` que retorna función `(request, locals, targetUserId) => void` que llama `recordAccess` con `adminId = locals.session.userId`. Si `action === 'view_raw_docs'`, lee `X-Access-Reason` y rechaza 400 si falta.
- [ ] **T7** Aplicar middleware en endpoints admin:
  - `src/pages/api/v1/admin/users/[id]/index.ts` (GET) — `auditAdminAccess('view_profile')`.
  - `src/pages/api/v1/admin/users/[id]/raw-docs.ts` (GET) — `auditAdminAccess('view_raw_docs')` con validación de header.
- [ ] **T8** Endpoint `src/pages/api/v1/users/me/access-log.ts` (GET, sesión):
  - `requireSession` → 401.
  - Query `getUserAccessLog(env, session.userId, 50, 0)`.
  - Responde 200 con array.
- [ ] **T9** Vista `src/pages/dashboard-admin/audit.astro` con tabla paginada (estilo `mockups/dashboard-admin.html`).
- [ ] **T10** Tests:
  - [ ] `tests/unit/validators/audit.test.ts` — schema rechaza `""`, `"   "`, string > 500; acepta `"Fiscalización"`.
  - [ ] `tests/integration/compliance/access-log.test.ts` — admin session GET `/admin/users/42` → fila en log con action='view_profile'; GET `/admin/users/42/raw-docs` sin header → 400; con `X-Access-Reason: "Fiscalización"` → 200 + fila con reason; user 42 GET `/users/me/access-log` → 2 filas ordenadas DESC; LEFT JOIN muestra display_name del admin.
  - [ ] Sabotaje 1: en `auditAdminAccess`, olvidar el `recordAccess` → GET admin no crea fila → test verifica que tras GET existe 1 fila en log → restaurar.
  - [ ] Sabotaje 2: en `view_raw_docs`, no validar `X-Access-Reason` → GET sin header devuelve 200 → test verifica 400 → restaurar.
  - [ ] Sabotaje 3: en `getUserAccessLog`, no aplicar `LIMIT 50` → devuelve 10000 filas en log masivo → test verifica que la respuesta tiene ≤ 50 elementos → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (vista admin + vista user)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/compliance/audit.ts` y `src/lib/middleware/audit.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: auditoría acceso admin a datos personales` y push a rama (no merge a main)