# HU-17.4 — Templates de verificación aprobada/rechazada

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-17-notificaciones-email

## Historia de usuario

**Como** prestador
**Quiero** recibir email cuando mi verificación cambia
**Para** saber el resultado sin entrar al dashboard

## Criterios de aceptación (Gherkin)

### Escenario: Email aprobado tras transición
  Cuando admin aprueba la verificación
  Entonces se envía `verification_approved` al prestador

### Escenario: Email rechazado incluye motivo
  Cuando admin rechaza con `reason="docs ilegibles"`
  Entonces el email incluye el motivo en el cuerpo

## Tareas técnicas

- [ ] Templates `verification_approved.html.ts`, `verification_rejected.html.ts`
- [ ] Hook en máquina de estados REQ-03.5
- [ ] Tests `tests/integration/email/verification.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
