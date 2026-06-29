# HU-08.1 — Schema contact_events con índices

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-08-contacto-tracking
**Rama:** `feat/HU-08.1-schema-contact-events`

## Tareas técnicas

- [ ] **T1** Agregar tabla `contact_events` a `src/database/schema.ts` siguiendo el modelo de `design.md` (id, providerId FK→providers ON DELETE CASCADE, kind enum, ipHash text, uaHash text, createdAt unixepoch). Drizzle `sqliteTable` con índices `idx_contact_events_provider` y `idx_contact_events_provider_date(provider_id, created_at)`.
- [ ] **T2** Helper `slugify` ya existe en `src/lib/utils/slug.ts` — no tocar. Si faltara, crearlo (kebab-case, lowercase, sin acentos).
- [ ] **T3** Validador `contactEventInsertSchema` y `contactKindSchema` en `src/lib/validators/contacts.ts` con Zod (`kind ∈ {whatsapp,phone,email}`, `ipHash` y `uaHash` longitud 64 hex).
- [ ] **T4** Generar migración con `docker exec quien-sabe-app bun run db:generate` → commitear SQL en `src/database/migrations/00XX_contact_events.sql` con CHECKs explícitos (`kind IN (...)`, `length(ip_hash)=64`, `length(ua_hash)=64`) y FK `ON DELETE CASCADE`.
- [ ] **T5** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio` que la tabla y los índices existen.
- [ ] **T6** Servicio `src/lib/services/contact-events.ts` exportando `insertContactEvent`, `countContactsByProvider`, `countContactsGlobal` (firmas en `design.md` §Capa de servicios; stubs que throw `NotImplemented` por ahora — la lógica vive en HU-08.2/08.4/08.5).
- [ ] **T7** Tests:
  - [ ] `tests/integration/contacts/schema.test.ts` — insert válido (Drizzle mockeado con better-sqlite3 o pool Workers), CHECK enum falla con `kind="otro"`, longitud hash, FK cascade, presencia de índices vía `EXPLAIN QUERY PLAN`.
- [ ] **T8** Verificar `PRAGMA foreign_keys = ON` en `src/database/client.ts`; si no está, agregar (no rompe tests existentes por ser idempotente).

## Definition of done

- [ ] Tests `bunx vitest run tests/integration/contacts/schema.test.ts` → verde
- [ ] Sabotaje confirmado: eliminar CHECK de `kind` en la migración → test rojo → restaurar
- [ ] Sabotaje 2: borrar índice `idx_contact_events_provider_date` → `EXPLAIN QUERY PLAN` muestra SCAN → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/validators/contacts.ts` y firmas de `src/lib/services/contact-events.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (no se ejecuta acá, queda para CI)
- [ ] Commit `feat: schema contact_events + índices` y push a rama (no merge a main)