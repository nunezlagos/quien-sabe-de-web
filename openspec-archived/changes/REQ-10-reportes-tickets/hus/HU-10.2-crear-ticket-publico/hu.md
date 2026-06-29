# HU-10.2 — Crear ticket público sin sesión

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-10-reportes-tickets

## Historia de usuario

**Como** visitante anónimo
**Quiero** abrir una consulta general sin necesidad de cuenta
**Para** preguntar dudas a soporte fácilmente

## Criterios de aceptación (Gherkin)

### Escenario: Crear ticket consulta anónimo
  Cuando envío `POST /api/v1/tickets` con `{"kind":"consulta","subject":"Cómo funcionan las reseñas","body":"...","contact_email":"juan@ejemplo.cl"}`
  Entonces recibo status 201
  Y la fila tiene `created_by_user_id=NULL`, `contact_email="juan@ejemplo.cl"`, `status="abierto"`
  Y se envía email de confirmación al solicitante

### Escenario: Email faltante en ticket anónimo → 422
  Cuando envío sin `contact_email`
  Entonces recibo status 422

### Escenario: Subject muy corto → 422
  Cuando envío `subject="hi"` (< 5)
  Entonces recibo status 422

### Escenario: Visitante anónimo no puede crear kind=suplantacion sin provider_id
  Cuando envío `kind=suplantacion` sin `target_provider_id`
  Entonces recibo status 422

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/tickets.ts` (POST)
- [ ] Zod schema `TicketCreate` en `src/lib/validators/tickets.ts`
- [ ] Helper que envía email de confirmación al crear
- [ ] Actualizar `mockups/profile.html` modal `#public-ticket-modal` (línea 238-296): (a) agregar input `name=subject` entre 'Correo' y 'Detalle' (requerido, min 5 chars); (b) renombrar label 'Detalle del Problema' → 'body'; (c) eliminar campo 'Tu RUT' (no existe en schema tickets).
- [ ] Tests `tests/integration/tickets/create-anonymous.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
