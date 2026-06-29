# HU-24.5 — Toggle global Disponible/Pausa manual desde dashboard

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-24-disponibilidad-horaria-prestador
**Rama:** `feat/HU-24.5-toggle-pausa-manual-dashboard`

## Tareas técnicas

- [ ] **T1** Agregar columna `manualAvailability INTEGER NOT NULL DEFAULT 1` a `providers` en `src/database/schema.ts`. Sin índice nuevo (lookup por PK).
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/00XX_providers_manual_availability.sql` con `ALTER TABLE providers ADD COLUMN manual_availability INTEGER NOT NULL DEFAULT 1` y `CHECK (manual_availability IN (0,1))`.
- [ ] **T3** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio` que la columna existe con DEFAULT 1.
- [ ] **T4** Validador `toggleAvailabilitySchema` en `src/lib/validators/availability.ts` (Zod, `{enabled: boolean}`).
- [ ] **T5** Servicio `src/lib/services/availability/toggle.ts` con `setManualAvailability(env, providerId, enabled)` (UPDATE idempotente) y `getManualAvailability(env, providerId)`.
- [ ] **T6** Extender `src/lib/services/availability/now.ts` (HU-24.3): `isAvailableNow(ranges, manualAvailability, now, tz)` retorna `false` si `manualAvailability === 0`, sin importar el rango.
- [ ] **T7] Endpoint `src/pages/api/v1/providers/me/availability/toggle.ts` (PATCH, sesión prestador):
  - `requireSession` + verificación rol prestador → 401/403.
  - Parsea body con `toggleAvailabilitySchema` → 400 si falla.
  - Llama `setManualAvailability`.
  - Responde 200 con `{manual_availability: 0|1}`.
- [ ] **T8** Componente `src/components/availability/AvailabilityToggle.astro` con prop `{initialEnabled}`. Mockup base `mockups/dashboard-provider.html:51-56`. Isla `client:load` con PATCH optimista.
- [ ] **T9** Integrar `AvailabilityToggle` en `src/components/dashboard/provider/SidebarNav.astro` (HU-12.1) — bloque "Estado" (`mockups/dashboard-provider.html:48-56`).
- [ ] **T10** Extender `src/components/availability/AvailabilityBadge.astro` (HU-24.3) para aceptar prop `manualAvailability`. Si `0` → renderiza badge gris "Pausado temporalmente".
- [ ] **T11** Pasar `manualAvailability` desde `src/pages/p/[slug].astro` (REQ-07) al badge público.
- [ ] **T12** Tests:
  - [ ] `tests/unit/availability/now-with-toggle.test.ts` — `isAvailableNow` retorna `false` con `manualAvailability=0`, incluso dentro de rango semanal.
  - [ ] `tests/unit/validators/availability.test.ts` — `toggleAvailabilitySchema` acepta/rechaza.
  - [ ] `tests/integration/availability/migration.test.ts` — migración aplica y DEFAULT 1 cubre prestadores existentes (sin fila → retorna 1).
  - [ ] `tests/integration/availability/toggle.test.ts` — PATCH ON, PATCH OFF, idempotencia, 401, 403, 400 body inválido.
  - [ ] `tests/e2e/provider-toggle-pause.spec.ts` — login → toggle OFF → label "En pausa" → vecino busca con `available_now=true` → prestador no aparece.
- [ ] **T13** Actualizar copy del label toggle en `mockups/dashboard-provider.html:54`: cambiar 'Disponible' → 'Visible para vecinos'/'En pausa'. (El mockup YA EXISTE — no es creación.)

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: en `isAvailableNow`, comentar la cláusula `&& manualAvailability === 1` → test unitario rojo → restaurar
- [ ] Sabotaje 2: en el endpoint, no verificar el rol prestador → test integración con sesión vecino da 200 → restaurar
- [ ] Sabotaje 3: en la migración, olvidar `DEFAULT 1` → prestadores pre-existientes quedan con `manual_availability=null`, queries fallan; test integración con fixture rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/availability/toggle.ts`, `src/lib/validators/availability.ts`
- [ ] Type check verde
- [ ] Commit `feat: toggle pausa manual dashboard prestador` y push