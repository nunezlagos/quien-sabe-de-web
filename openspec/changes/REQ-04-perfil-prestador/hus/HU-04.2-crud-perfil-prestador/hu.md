# HU-04.2 — CRUD del perfil de prestador con Zod

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-04-perfil-prestador

## Historia de usuario

**Como** prestador con cuenta
**Quiero** crear, editar y eliminar mi perfil
**Para** controlar mi presencia pública en la plataforma

## Criterios de aceptación (Gherkin)

### Escenario: Crear perfil válido
  Dado un prestador sin perfil
  Cuando envío `POST /api/v1/providers/me` con `{"trade_id":1,"commune_id":13114,"description":"15 años de oficio","phone":"+56912345678","hourly_rate_clp":25000}`
  Entonces recibo status 201
  Y existe fila en `providers` con `status="draft"`

### Escenario: Editar perfil propio
  Cuando envío `PATCH /api/v1/providers/me` con `{"hourly_rate_clp":30000}`
  Entonces recibo status 200 y el campo queda actualizado

### Escenario: Intentar editar perfil ajeno → 403
  Dado el prestador A intenta modificar mediante hack la fila del prestador B
  Cuando envía PATCH manipulado
  Entonces recibo status 403

### Escenario: Eliminar es soft-delete
  Cuando envío `DELETE /api/v1/providers/me`
  Entonces recibo status 204
  Y la fila queda con `status="deleted"` (no se borra físicamente)

### Escenario: Crear perfil duplicado → 409
  Dado un prestador con perfil existente
  Cuando envía POST de creación
  Entonces recibo status 409 con `{ "error": "perfil ya existe" }`

## Tareas técnicas

- [ ] Zod schemas `ProviderCreate`, `ProviderPatch` en `src/lib/validators/providers.ts`
- [ ] Sanitización HTML de `description` con DOMPurify-server
- [ ] Endpoint `src/pages/api/v1/providers/me/index.ts` (POST/PATCH/DELETE/GET)
- [ ] Helper `generateSlug(trade, commune, suffix?)` en `src/lib/utils/slug.ts`
- [ ] Tests `tests/unit/validators/providers.test.ts`, `tests/integration/providers/crud.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
