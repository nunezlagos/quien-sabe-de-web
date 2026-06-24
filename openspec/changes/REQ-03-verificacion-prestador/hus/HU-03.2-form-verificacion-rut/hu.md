# HU-03.2 — Formulario de verificación de prestador

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-03-verificacion-prestador

## Historia de usuario

**Como** prestador con cuenta activa
**Quiero** iniciar mi proceso de verificación
**Para** poder aparecer en la búsqueda pública una vez aprobado

## Criterios de aceptación (Gherkin)

### Escenario: Crear solicitud de verificación válida
  Dado un prestador con `rut` válido "12.345.678-5"
  Cuando envío `POST /api/v1/providers/me/verification` con ese rut
  Entonces recibo `302 /verificar-oficio?ok=1&trade=...&rut=...` *(MVP: 302 con acuse, no 201 — ver notas)*
  Y la fila en `provider_verifications` con `status="pendiente"` *(pendiente: schema no existe todavía en MVP)*

### Escenario: Solicitud existente en estado pendiente → 409
  Dado que ya existe una solicitud en `pendiente` para este prestador
  Cuando envía otra solicitud
  Entonces recibo 302 con error *(MVP: el endpoint actual no chequea duplicados — pendiente)*

### Escenario: GET estado actual
  Cuando envío `GET /api/v1/providers/me/verification`
  Entonces recibo `{ status, created_at, reviewed_at, rejection_reason? }` *(pendiente: no implementado)*

### Escenario: Solicitud anterior rechazada permite reenviar
  Dado una verificación en estado `rechazado`
  Cuando envía nueva solicitud
  Entonces recibo 302 con acuse *(MVP: siempre acepta, no hay máquina de estados todavía)*

## Tareas técnicas

- [x] Endpoint `src/pages/api/v1/providers/me/verification.ts` (commit `be88e72`)
- [x] Vista `src/pages/verificar-oficio.astro` (commit `be88e72`) — *path real: `/verificar-oficio` (español), no `/verification`*
- [x] Schema Zod en `src/lib/validators/verification.ts` + 9 tests unit (commit `c80e62f`)
- [x] Componente Astro Form *(inline en .astro por ahora — fiel al mockup con hero + 3 steps + form)*
- [ ] Schema `provider_verifications` en `src/database/schema.ts` *(pendiente: MVP sólo valida)*
- [ ] Persistencia de solicitudes *(pendiente — la DB se toca para validar binding pero no inserta)*
- [ ] Tests `tests/integration/verification/form.test.ts`, `tests/e2e/verification-submit.spec.ts`
- [ ] Refactorizar `mockups/verification.html`: reducir al alcance real de HU-03.2 (solo RUT + oficio principal + submit). Las zonas de upload 'Certificaciones' y 'Fotos de trabajos' (líneas 102-117) se dejan como placeholder con nota 'ver HU-03.3'.

## Definition of done

- [x] Tests Vitest unit pasan (9 tests en `verification.test.ts`)
- [ ] Tests Vitest integración pasan *(bloqueado: better-sqlite3 sin bindings para Node 25)*
- [x] Test E2E Playwright manual pasa *(verificado vía MCP: `rut=12345678-9, trade=gasfiter` → 302 → acuse verde)*
- [ ] Sabotaje confirmado *(sabotaje equivalente hecho en `trades.test.ts` cubre el patrón de regex; replicable a este schema)*
- [ ] Coverage ≥ 90 %
- [ ] Type check verde
- [ ] PR mergeado

## Notas de implementación (commit `be88e72`)

- Path real: `/verificar-oficio` (español)
- Color primario cambiado de verde mockup a `orange-500` (naranja del proyecto)
- MVP: POST devuelve 302 a `/verificar-oficio?ok=1&trade=...&rut=...` con acuse — no persiste (la tabla `provider_verifications` no existe en schema todavía)
- El endpoint sólo valida con Zod + hace `SELECT 1` sobre `users` para validar binding D1
- Hero + 3 pasos visuales del mockup están en la página (Regístrate/Sube documentos/¡Listo!) aunque en MVP el paso 1 ya está hecho
- Próximo paso mostrado en banner azul: "subir documentos (cédula, certificaciones)" — eso es HU-03.3
