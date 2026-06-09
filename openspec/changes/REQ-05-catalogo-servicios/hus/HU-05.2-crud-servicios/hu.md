# HU-05.2 — CRUD de servicios del prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-05-catalogo-servicios

## Historia de usuario

**Como** prestador
**Quiero** administrar el catálogo de servicios que ofrezco
**Para** tener varios servicios bajo mi perfil con precios y descripciones

## Criterios de aceptación (Gherkin)

### Escenario: Crear servicio válido
  Cuando envío `POST /api/v1/providers/me/services` con `{"title":"Instalación de calefón","description":"Incluye prueba de fugas","price_clp":45000,"unit":"visita"}`
  Entonces recibo status 201
  Y existe fila en `services` con `sort_order` = (max + 1) o 0

### Escenario: Listar servicios propios
  Cuando envío `GET /api/v1/providers/me/services`
  Entonces recibo array ordenado por `sort_order` asc

### Escenario: Editar precio
  Cuando envío `PATCH /api/v1/providers/me/services/7` con `{"price_clp":50000}`
  Entonces recibo status 200 y el campo actualizado

### Escenario: Editar servicio ajeno → 403
  Dado el prestador A intenta `PATCH /api/v1/providers/me/services/<id de B>`
  Cuando envía la petición
  Entonces recibo status 403

### Escenario: Eliminar servicio
  Cuando envío `DELETE /api/v1/providers/me/services/7`
  Entonces recibo status 204
  Y la fila ya no existe

## Tareas técnicas

- [ ] Zod schemas `ServiceCreate`, `ServicePatch` en `src/lib/validators/services.ts`
- [ ] Endpoint `src/pages/api/v1/providers/me/services/index.ts`
- [ ] Endpoint `src/pages/api/v1/providers/me/services/[id].ts`
- [ ] Normalizador de título (trim, capitaliza)
- [ ] Tests `tests/unit/validators/services.test.ts`, `tests/integration/services/crud.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
