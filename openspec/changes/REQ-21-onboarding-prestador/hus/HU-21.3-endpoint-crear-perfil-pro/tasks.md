# HU-21.3 — Endpoint crear perfil PRO desde wizard

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-21-onboarding-prestador
**Rama:** `feat/HU-21.3-endpoint-crear-perfil-pro`

## Tareas técnicas

- [ ] **T1** Helper `normalizeWhatsapp(raw)` en `src/lib/utils/phone.ts` con regex `/\D/g` y casos: 9 dígitos que empiezan con 9, 11 dígitos que empiezan con 569, 8 dígitos, otros → throw.
- [ ] **T2** Extender Zod schema en `src/lib/validators/providers.ts` con `providerCreateSchema` (discriminated union `trade_id` vs `trade_pending_approval`, `bio` ≤ 500, `commune_ids` 1-14, `base_price_clp` > 0).
- [ ] **T3** Servicio `src/lib/services/trades/pending.ts` con `createPendingTrade(env, name)` que inserta fila en `trades` con `status="pending"` (aprobación admin futura).
- [ ] **T4** Servicio `src/lib/services/providers/create.ts` con `createProviderFromWizard(env, userId, payload)` que orquesta: validar Zod, normalizar WhatsApp, ejecutar `db.batch([insertProviders, ...insertProviderCommunes, optionalInsertPendingTrade])`.
- [ ] **T5** Extender `src/pages/api/v1/providers/me/index.ts` (POST handler):
  - `requireSession` → 401 sin sesión.
  - `requireVerifiedEmail` (REQ-20) → 403 si no verificó.
  - `requireNoExistingProvider` (helper que consulta `providers WHERE user_id = ?`) → 403 si ya tiene provider.
  - Parse con `providerCreateSchema` → 422 si falla.
  - Llama `createProviderFromWizard`.
  - Responde 201 `{id, status}`.
- [ ] **T6** Tests:
  - [ ] `tests/unit/utils/phone.test.ts` — casos: `912345678` → `+56912345678`; `+56912345678` → `+56912345678`; `56912345678` → `+56912345678`; `12345678` → `+56912345678`; vacío lanza; `"abc"` lanza.
  - [ ] `tests/unit/validators/providers.test.ts` — bio > 500 rechaza; commune_ids vacío rechaza; sin `trade_id` y sin `trade_pending_approval` rechaza; `trade_id=1` con `trade_pending_approval=null` acepta.
  - [ ] `tests/integration/providers/wizard-create.test.ts` — POST válido devuelve 201 con 3 filas en `provider_communes`; INSERT de commune inválido (id inexistente) hace rollback completo (no queda `providers` huérfano); user sin verify devuelve 403; user con provider existente devuelve 403.
  - [ ] Sabotaje 1: en `createProviderFromWizard`, quitar `await db.batch([...])` y usar `await insertProviders; await insertCommunes;` secuencial → test con INSERT commune inválido detecta fila huérfana en `providers` → restaurar.
  - [ ] Sabotaje 2: en el endpoint, olvidar la verificación de `requireVerifiedEmail` → test con sesión sin verify da 201 → restaurar (debe ser 403).
  - [ ] Sabotaje 3: en `normalizeWhatsapp`, no normalizar el caso `12345678` (8 dígitos sin 9) → persiste sin el 9 inicial, `+5612345678` inválido para WhatsApp → test integración con payload `whatsapp: "12345678"` verifica string almacenado `+56912345678` → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (consumido por HU-21.4)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/providers/create.ts` y `src/lib/utils/phone.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: endpoint crear perfil PRO desde wizard` y push a rama (no merge a main)