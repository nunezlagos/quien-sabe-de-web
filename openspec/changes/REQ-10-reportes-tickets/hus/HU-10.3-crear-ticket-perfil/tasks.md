# HU-10.3 — Crear ticket desde perfil de prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-10-reportes-tickets
**Rama:** `feat/HU-10.3-crear-ticket-perfil`

## Tareas técnicas

- [ ] **T1** Validador `authenticatedTicketCreateSchema` en `src/lib/validators/tickets.ts`.
- [ ] **T2** Helper `verifyProviderExists(env, providerId): Promise<boolean>` en `src/lib/services/providers.ts`.
- [ ] **T3** Helper `findOpenTicketsAgainstProvider(env, userId, providerId): Promise<number>` en `src/lib/services/tickets.ts`.
- [ ] **T4** Extender `createTicket(env, input, session)` en `src/lib/services/tickets.ts` con la rama autenticada:
  - Si sesión y `input.kind !== 'consulta'` → INSERT con `created_by_user_id=session.user.id`, `target_provider_id=input.targetProviderId`, `contact_email=NULL`.
  - Si `findOpenTicketsAgainstProvider > 0` → INSERT extra `ticket_messages` con `sender='system'`, `internal_note=true`.
- [ ] **T5** Endpoint `src/pages/api/v1/tickets.ts` (POST, rama autenticada):
  - Si `session === null` → `anonymousTicketCreateSchema` (HU-10.2).
  - Si `session !== null` → `authenticatedTicketCreateSchema`.
  - Validar body → 422.
  - `verifyProviderExists` → 404 si false.
  - `createTicket(...)`.
  - 201.
- [ ] **T6** Componente `src/components/providers/ReportModal.astro`:
  - Props: `providerId, providerName, currentUser`.
  - Si `currentUser === null` → CTA "Regístrate o inicia sesión para reportar más rápido" con link a `/login?redirect=/p/<slug>`.
  - Si hay sesión: form con Nombre (readonly), Email (readonly), Tipo (`<select>`), Detalle (`<textarea>`).
  - Botón "Enviar Reporte" con submit handler que hace fetch.
  - Toast tras 201: "Reporte enviado. Te contactaremos por email."
- [ ] **T7** Integrar `<ReportModal>` en `PublicProfile.astro` (HU-07.2), abriendo desde botón "Reportar" (`mockups/profile.html:100-102`).
- [ ] **T8** Tests:
  - [ ] `tests/unit/validators/tickets.test.ts` (extender) — `authenticatedTicketCreateSchema`: kind válido; target_provider_id positivo; subject 4 falla; body 5001 falla.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `verifyProviderExists` true/false; `findOpenTicketsAgainstProvider` 0/1/3.
  - [ ] `tests/unit/services/tickets.test.ts` (extender) — `createTicket` autenticado: inserta con `created_by_user_id` poblado; segundo ticket del mismo user+provider → inserta system message con `internal_note=true`.
  - [ ] `tests/integration/tickets/create-from-profile.test.ts` — POST autenticado → 201; POST sin target_provider_id → 422; target_provider_id=99999 → 404; segundo ticket del mismo user+provider → 201 + system message.
  - [ ] `tests/e2e/profile-report.spec.ts` — Playwright login vecino, ir a perfil, clic "Reportar", completar form, submit, ver toast y modal cerrado.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Sabotaje confirmado: comentar `verifyProviderExists` → test "target_provider_id=99999 → 404" cae (devuelve 201 con FK error) → restaurar
- [ ] Sabotaje 2: olvidar la creación del system message cuando `findOpenTicketsAgainstProvider > 0` → test "segundo ticket → system message" cae → restaurar
- [ ] Sabotaje 3: en el modal, no prellenar Nombre/Email cuando hay sesión → test E2E "campos prellenados" cae → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/services/tickets.ts` (rama autenticada)
- [ ] Type check verde
- [ ] Commit `feat: POST /tickets autenticado desde perfil + ReportModal` y push
