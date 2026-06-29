# HU-22.3 — Export de datos del titular en JSON

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.3-endpoint-export-datos-titador`

## Tareas técnicas

- [ ] **T1** Helper `hashEmail(email)` en `src/lib/utils/crypto.ts` con SHA-256 (mismo módulo que `hashIp` usado en HU-08.1). Reusar para anonimizar el email del titular en el export.
- [ ] **T2** Servicio `src/lib/services/compliance/export.ts` con `getUserDataExport(env, userId)` que ejecuta 6 queries (users, providers+communes join, reviews, favorites, contact_events, user_consents) y construye el objeto `UserDataExport` (ver shape en design.md).
- [ ] **T3** Helper `assertRateLimit(env, userId, 'data_export', 86400)` que consulta `env.SESSION.get('data_export:<userId>')` y lanza `RateLimitError` si existe.
- [ ] **T4** Endpoint `src/pages/api/v1/users/me/data-export.ts` (GET, sesión):
  - `requireSession` → 401.
  - `assertRateLimit` → 429 si excede.
  - Llama `getUserDataExport`.
  - Insert audit `data_access_log(actor=self, action='data_export')` (HU-22.6 schema).
  - `setRateLimit(env, 'data_export:<userId>', 86400)`.
  - Responde 200 con `Content-Type: application/json` + `Content-Disposition: attachment; filename="qs-data-{userId}-{YYYY-MM-DD}.json"`.
- [ ] **T5** Tests:
  - [ ] `tests/unit/services/export.test.ts` — con mocks: `user.provider_profile = null` cuando no tiene provider; reseñas ordenadas; favoritos con slug; contactos sin `ip_hash`/`ua_hash`.
  - [ ] `tests/unit/utils/crypto.test.ts` — `hashEmail("foo@bar.cl")` produce hex 64 chars; dos llamadas con mismo input producen mismo hash.
  - [ ] `tests/integration/compliance/export.test.ts` — fixture con provider + 2 reseñas + 1 favorito + 1 contacto: GET devuelve 200 con shape válido (validar con `dataExportResponseSchema`); segunda GET misma hora devuelve 429; verifica fila en `data_access_log`.
  - [ ] Sabotaje 1: en el endpoint, olvidar `assertRateLimit` → segunda GET misma hora devuelve 200 → test integración verifica 429 (rojo) → restaurar.
  - [ ] Sabotaje 2: en `getUserDataExport`, incluir `email` plano en vez de `email_hash` → test verifica que la clave es `email_hash` con 64 chars hex (no `email: "foo@..."`) → restaurar.
  - [ ] Sabotaje 3: olvidar el `Content-Disposition: attachment` → E2E verifica que la respuesta tiene el header (test rojo) → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (descarga efectiva)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/compliance/export.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint export datos titular` y push a rama (no merge a main)