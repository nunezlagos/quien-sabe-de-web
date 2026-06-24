# HU-22.5 — Consentimiento granular por finalidad

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-22-compliance-ley-19628
**Rama:** `feat/HU-22.5-consentimiento-granular`

## Tareas técnicas

- [ ] **T1** Agregar tabla `userConsents` a `src/database/schema.ts` con PK auto-increment, FK a `users` con cascade, columnas `purpose` (enum), `granted` (boolean), `grantedAt` (timestamp), `source` (enum). Índices `(user_id, granted_at)` y `(user_id, purpose, granted_at)`.
- [ ] **T2** Migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_user_consents.sql` con `CREATE TABLE user_consents (...)` e índices.
- [ ] **T3** Aplicar migración: `docker exec quien-sabe-app bun run db:migrate:local`.
- [ ] **T4** Validador `consentToggleSchema` en `src/lib/validators/consent/granular.ts` con Zod (cada campo opcional bool; `refine` exige ≥1 toggle).
- [ ] **T5** Servicio `src/lib/services/consent/granular.ts`:
  - `recordConsentChanges(env, userId, toggles, source)` — INSERT en batch atómico.
  - `getCurrentConsents(env, userId)` — query agregada con `MAX(id) GROUP BY purpose`.
- [ ] **T6** Middleware `consentRequired(purpose)` en `src/lib/middleware/consent.ts` que lee el último consent por purpose y bloquea con 403 si `!granted`.
- [ ] **T7** Endpoint `src/pages/api/v1/users/me/consent.ts` (PATCH, sesión):
  - `requireSession` → 401.
  - Parse con `consentToggleSchema` → 400 si vacío.
  - Llama `recordConsentChanges`.
  - Invalida cache `consent:{userId}` en KV.
  - Responde 200 con estado actual.
- [ ] **T8** Tests:
  - [ ] `tests/unit/validators/consent-granular.test.ts` — schema acepta `{communications: false}`; rechaza `{}`; rechaza `{communications: "yes"}`.
  - [ ] `tests/integration/compliance/consent.test.ts` — fixture user sin consents: PATCH `{communications: false}` → 200 + 1 fila `user_consents` con `granted=0`; segunda PATCH `{communications: true}` → 200 + 2 filas (append-only); `getCurrentConsents` retorna `communications: true`; middleware `consentRequired('analytics')` con user sin fila da 403; tras PATCH `{analytics: true}` el middleware acepta.
  - [ ] Sabotaje 1: en `recordConsentChanges`, hacer UPDATE en vez de INSERT → test verifica que tras 2 toggles hay 2 filas (no 1) → restaurar.
  - [ ] Sabotaje 2: en el middleware `consentRequired`, olvidar el cache invalidation tras PATCH → segundo toggle no se refleja → test verifica que tras PATCH el estado cambia inmediatamente → restaurar.
  - [ ] Sabotaje 3: en el endpoint, no validar `Object.keys(toggles).length > 0` → PATCH `{}` inserta 0 filas y devuelve 200 con consent actual → test verifica 400 con body vacío → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (toggle UI básico)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/consent/granular.ts` y `src/lib/middleware/consent.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: consentimiento granular por finalidad` y push a rama (no merge a main)