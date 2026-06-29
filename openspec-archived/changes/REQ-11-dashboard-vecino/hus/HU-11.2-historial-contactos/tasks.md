# HU-11.2 — Historial de contactos del vecino

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-11-dashboard-vecino
**Rama:** `feat/HU-11.2-historial-contactos`

## Tareas tecnicas

- [ ] **T1** Migración aditiva `src/database/migrations/00XX_contact_events_user.sql`: `ALTER TABLE contact_events ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;` + `CREATE INDEX idx_contact_events_user_date ON contact_events(user_id, created_at DESC);`.
- [ ] **T2** Actualizar `src/database/schema.ts`: agregar `userId` nullable con FK a `users.id`, agregar índice `byUserDate`.
- [ ] **T3** Actualizar `src/lib/services/contact-events.ts#insertContactEvent` (de HU-08.1) para aceptar `userId?: number` opcional.
- [ ] **T4** Funciones `encodeCursor` y `decodeCursor` en `src/lib/services/contact-events.ts` (base64 JSON `{t: epochSeconds, id: number}`).
- [ ] **T5** Función `listUserContacts(env, userId, opts)` en `src/lib/services/contact-events.ts` con SQL descrito en design.md (incluye subquery `EXISTS` para `can_review`).
- [ ] **T6** Endpoint `src/pages/api/v1/users/me/contacts.ts` (`GET`) con guard de sesión, validación Zod `contactsListQuerySchema`, llamada a `listUserContacts`.
- [ ] **T7** Componente `src/components/dashboard/user/ContactRow.astro` con props `{ item: ContactHistoryItem }`.
- [ ] **T8** Componente `src/components/dashboard/user/ContactsHistory.astro` que mapea `items` a filas y renderiza link "Ver más" si `nextCursor` no es null.
- [ ] **T9** Integrar `ContactsHistory` en el slot `contacts` del layout de HU-11.1 (verificar que el componente existe antes de enlazarlo).
- [ ] **T10** Tests:
  - [ ] `tests/unit/contacts-history/cursor.test.ts` — encode/decode simétrico, JSON malformado lanza.
  - [ ] `tests/unit/contacts-history/canReview.test.ts` — sin review previa + dentro de 7 días → true; con review → false.
  - [ ] `tests/integration/users/contacts-history.test.ts` — 14 filas, vecino A pide `limit=10` → 10 + cursor; siguiente página → 4; vecino B pide mismos filtros → sólo ve suyos.
  - [ ] `tests/integration/users/contacts-history-cross-user.test.ts` — sin sesión → 401; admin → 403 (no es vecino).
  - [ ] `tests/e2e/contacts-history.spec.ts` — login vecino → tab contactos → ve filas → click "Dejar reseña" navega a `/p/<slug>`.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests Playwright `bunx playwright test tests/e2e/contacts-history.spec.ts` → verde
- [ ] Migración aplica en D1 local sin errores (`docker exec quien-sabe-app bun run db:migrate:local`)
- [ ] Sabotajes confirmados (mínimo 2):
  - [ ] Sabotaje 1: comentar `WHERE ce.user_id = ?` en `listUserContacts` → test "vecino A no ve contactos de B" cae en rojo → restaurar
  - [ ] Sabotaje 2: hardcodear `can_review: true` en el mapeo → test "can_review=false si ya reseñó" cae en rojo → restaurar
  - [ ] Sabotaje 3: cambiar el `ORDER BY ce.created_at DESC` por ASC → test E2E de orden cronológico cae en rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/contact-events.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama (no merge a main)
