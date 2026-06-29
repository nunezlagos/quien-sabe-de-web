# HU-03.2 — Formulario de verificación de prestador

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-03-verificacion-prestador
**Rama:** `feat/HU-03.2-form-verificacion-rut`

## Tareas tecnicas

- [ ] **T1** Agregar tabla `providerVerifications` a `src/database/schema.ts` con `userId`, `rut`, `status` enum, `rejectionReason`, `reviewedBy`, `reviewedAt`, `createdAt` e índices.
- [ ] **T2** Migración `src/database/migrations/0006_provider_verifications.sql` con `CHECK` sobre `status` e índice único parcial `WHERE status='pendiente'`.
- [ ] **T3** Helper `maskRut(rut)` en `src/lib/services/verification/mask-rut.ts`.
- [ ] **T4** Zod schemas `CreateVerificationBody` y `VerificationPublicView` en `src/lib/validators/verification.ts`.
- [ ] **T5` Servicio `src/lib/services/verification/index.ts` con `createVerification`, `getCurrentVerification`.
- [ ] **T6** Endpoint `src/pages/api/v1/providers/me/verification/index.ts` con handlers `POST` y `GET`.
- [ ] **T7** Componente `src/components/verification/Form.astro` (form HTML) y vista `src/pages/verification.astro` (replica layout de `mockups/verification.html:77-128`).
- [ ] **T8** Tests:
  - [ ] `tests/unit/verification/mask-rut.test.ts` — `"12345678-5"` → `"12.***.*5"`; `"9876543-K"` → `"9.***.*K"`.
  - [ ] `tests/integration/verification/form.test.ts` — POST con RUT válido + sin pendiente → 201 + fila en DB; con pendiente existente → 409 `verificación ya en curso`; con RUT inválido → 422 con detalle; GET con sesión activa devuelve shape exacto `VerificationPublicView` con `rut_masked` (nunca `rut` crudo).
  - [ ] `tests/e2e/verification-submit.spec.ts` — prestador navega a `/verification` → completa form → ve confirmación.

## Sabotaje obligatorio

- [ ] **Sabotaje 1**: quitar el check de "ya existe pendiente" en `createVerification` (siempre inserta) → test "Solicitud existente en estado pendiente → 409" debe detectar que se crea una segunda fila pendiente → restaurar.
- [ ] **Sabotaje 2`: en `getCurrentVerification`, devolver `rut` crudo en vez de `maskRut(rut)` → test "GET devuelve rut_masked, nunca rut crudo" debe detectar el campo `rut` en la respuesta → restaurar.
- [ ] **Sabotaje 3`: eliminar la validación Zod del RUT en el endpoint POST → test "RUT inválido → 422" debe detectar que se acepta un RUT basura → restaurar (el validador de HU-03.1 ya cubre el DV; este sabotaje es omitir la llamada a `CreateVerificationBody.parse`).

## Definition of done

- [ ] Tests `bunx vitest run` → verde (unit + integración)
- [ ] Sabotajes 1, 2 y 3 confirmados (rojo → restaurar)
- [ ] Coverage ≥ 90% en `src/lib/services/verification/` y `src/pages/api/v1/providers/me/verification/`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-03.2-form-verificacion-rut` (no merge a main sin review)
