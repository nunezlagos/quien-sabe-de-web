# HU-03.6 — Badge de verificación en perfil público

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.6-badge-verificado`

## Tareas tecnicas

- [ ] **T1** Agregar índice `byUserStatus` a `providerVerifications` en `src/database/schema.ts` y migración `src/database/migrations/000A_verified_index.sql` con `CREATE INDEX idx_provider_verifications_user_status ON provider_verifications(user_id, status);`.
- [ ] **T2** Helper `isVerified(db, providerUserId)` en `src/lib/services/providers/verified.ts`.
- [ ] **T3** Extender `src/lib/services/providers/index.ts` (cuando exista de REQ-04/07) para incluir `verified` en el DTO público.
- [ ] **T4** Componente `src/components/providers/VerifiedBadge.astro` con prop `verified: boolean` que renderiza el span con `data-verified="true"` y `id="profile-verified-badge"` cuando true, nada cuando false.
- [ ] **T5` Integrar `<VerifiedBadge>` en la vista pública del perfil (`src/pages/p/[slug].astro` cuando exista de REQ-07) en la posición del header (cerca de `#profile-name`, según `mockups/profile.html:65-67`).
- [ ] **T6** Tests:
  - [ ] `tests/unit/providers/verified.test.ts` — `isVerified(db, 7)` con fila `status='verificado'` → true; con `status='rechazado'` → false; sin fila → false.
  - [ ] `tests/integration/providers/verified-flag.test.ts` — GET `/api/v1/providers/<slug>` con prestador verificado → `verified: true` en response; sin verificación → `verified: false`.
  - [ ] `tests/e2e/profile-badge.spec.ts` — visita HTML al perfil verificado → DOM contiene `[data-verified="true"]`; perfil no verificado → no contiene ese atributo.

## Sabotaje obligatorio

- [ ] **Sabotaje 1`: en `isVerified`, cambiar el filtro `status='verificado'` por `status='pendiente'` → test "Perfil verificado muestra badge" debe detectar que un prestador pendiente aparece como verificado → restaurar.
- [ ] **Sabotaje 2`: en el componente `VerifiedBadge.astro`, cambiar `data-verified="true"` por `data-verified="yes"` → test E2E que verifica el atributo exacto debe detectar el mismatch → restaurar (el atributo es contract de tests).
- [ ] **Sabotaje 3`: eliminar el `<VerifiedBadge>` del render del perfil (comentar la línea) → test E2E "Perfil verificado muestra badge" debe detectar ausencia del elemento en el DOM → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/providers/verified.ts` y `src/components/providers/VerifiedBadge.astro`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.6-badge-verificado` (no merge a main sin review)
