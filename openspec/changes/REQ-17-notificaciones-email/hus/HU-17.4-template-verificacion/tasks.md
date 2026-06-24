# HU-17.4 — Templates de verificación aprobada/rechazada

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-17-notificaciones-email
**Rama:** `feat/HU-17.4-template-verificacion`

## Tareas tecnicas

- [ ] **T1** Crear `verification_approved.html.ts` y `verification_approved.txt.ts` con función `render(vars)`. Vars: `{ name, profileUrl }`. HTML escapa `name`. Subject sugerido: "¡Fuiste verificado en Quién Sabe!".
- [ ] **T2** Crear `verification_rejected.html.ts` y `verification_rejected.txt.ts` con función `render(vars)`. Vars: `{ name, reason, reapplyUrl }`. HTML escapa `name` y `reason`. Subject: "Tu verificación necesita correcciones".
- [ ] **T3** Registrar ambos templates en `src/lib/services/email/templates/index.ts` con sus `varsSchema` Zod.
- [ ] **T4** Tests unitarios de cada template (render normal, escape de `reason` con `<script>`, validación Zod).
- [ ] **T5** Integración con REQ-03: localizar `src/lib/services/verification/transitions.ts` (o equivalente). Si `approve`/`reject` no reciben `emailService`, agregarlo como parámetro (sub-tarea de coordinación con REQ-03).
- [ ] **T6** En `transitions.approve(...)`, después del UPDATE, llamar `emailService.send({ template:'verification_approved', to: provider.email, vars: { name, profileUrl: origin + '/providers/' + providerId }, relatedEntity:`provider:${providerId}` })` con try/catch que no aborte la transición si falla.
- [ ] **T7** En `transitions.reject(...)`, llamar `emailService.send({ template:'verification_rejected', to, vars: { name, reason, reapplyUrl: origin + '/verify' }, relatedEntity:`provider:${providerId}` })` con try/catch análogo.
- [ ] **T8** Tests:
  - [ ] `tests/unit/email/templates/verification-approved.test.ts` — render normal; varsSchema rechaza sin `profileUrl`.
  - [ ] `tests/unit/email/templates/verification-rejected.test.ts` — render incluye `reason` escapado; varsSchema limita `reason` a 500.
  - [ ] `tests/integration/email/verification.test.ts` — mock `emailService`; llamar `transitions.approve` resulta en `send` con `template:'verification_approved'` y vars correctos; idem `reject` con `reason`.
  - [ ] Test explícito: si `emailService.send` lanza, la transición de estado NO se aborta (estado ya committed).
- [ ] **T9** Verificar manualmente con Mailpit: usar endpoint admin de REQ-03 (o un script de seed) para aprobar y rechazar una verificación de prueba, revisar la UI de Mailpit, confirmar ambos emails.

## Sabotajes a confirmar

1. En `verification_rejected.html.ts`, eliminar el escape de `reason` → test unitario con `reason="<script>alert(1)</script>"` y assert de escape falla → restaurar.
2. En `transitions.approve`, olvidar la llamada a `emailService.send` → test integración que mockea `emailService` y verifica 1 llamada falla → restaurar.
3. En `transitions.approve`, envolver `emailService.send` sin try/catch y hacer que el mock rechace → la transacción aborta, test que verifica "estado committed aunque email falle" falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/email/templates/verification-approved.test.ts tests/unit/email/templates/verification-rejected.test.ts tests/integration/email/verification.test.ts` → verde
- [ ] Sabotaje 1 confirmado: sin escape → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: `send` omitido → test rojo → restaurar
- [ ] Sabotaje 3 confirmado: sin try/catch → test rojo → restaurar
- [ ] Coverage ≥ 90 % en los 4 archivos de template y la integración con `transitions`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: templates verification_approved / verification_rejected` y push a rama (no merge a main)
