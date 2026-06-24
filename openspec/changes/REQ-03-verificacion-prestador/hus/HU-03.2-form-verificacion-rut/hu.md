# HU-03.2 — Formulario de verificación de prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** prestador con cuenta activa
**Quiero** iniciar mi proceso de verificación
**Para** poder aparecer en la búsqueda pública una vez aprobado

## Criterios de aceptación (Gherkin)

### Escenario: Crear solicitud de verificación válida
  Dado un prestador con `rut` válido "12.345.678-5"
  Cuando envío `POST /api/v1/providers/me/verification` con ese rut
  Entonces recibo status 201
  Y existe fila en `provider_verifications` con `status="pendiente"`
  Y el `reviewed_by` es null

### Escenario: Solicitud existente en estado pendiente → 409
  Dado que ya existe una solicitud en `pendiente` para este prestador
  Cuando envía otra solicitud
  Entonces recibo status 409 con `{ "error": "verificación ya en curso" }`

### Escenario: GET estado actual
  Cuando envío `GET /api/v1/providers/me/verification`
  Entonces recibo `{ status, created_at, reviewed_at, rejection_reason? }`

### Escenario: Solicitud anterior rechazada permite reenviar
  Dado una verificación en estado `rechazado`
  Cuando envía nueva solicitud
  Entonces recibo status 201 con una nueva fila

## Tareas técnicas

- [ ] Schema `provider_verifications` en `src/database/schema.ts`
- [ ] Endpoint `src/pages/api/v1/providers/me/verification/index.ts`
- [ ] Componente Astro `src/components/verification/Form.astro`
- [ ] Vista `src/pages/verification.astro`
- [ ] Tests `tests/integration/verification/form.test.ts`, `tests/e2e/verification-submit.spec.ts`
- [ ] Refactorizar `mockups/verification.html`: reducir al alcance real de HU-03.2 (solo RUT + oficio principal + submit). Las zonas de upload 'Certificaciones' y 'Fotos de trabajos' (líneas 102-117) se dejan como placeholder con nota 'ver HU-03.3'.

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
