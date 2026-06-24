# HU-13.3 — CRUD de oficios (trades) con reorder

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-13-dashboard-admin

## Historia de usuario

**Como** admin
**Quiero** administrar la taxonomía de oficios
**Para** mantener consistencia en perfiles y búsqueda

## Criterios de aceptación (Gherkin)

### Escenario: Crear oficio
  Cuando envía `POST /api/v1/admin/trades` con `{"name":"Cerrajero","slug":"cerrajero"}`
  Entonces recibo status 201 y aparece en `GET /api/v1/admin/trades`

### Escenario: Eliminar oficio en uso → 409
  Dado un oficio referenciado por al menos un provider
  Cuando intento `DELETE /api/v1/admin/trades/<id>`
  Entonces recibo status 409 con `{ "error": "oficio en uso" }`

### Escenario: Reordenar oficios
  Cuando envía `POST /api/v1/admin/trades/reorder` con array
  Entonces el `sort_order` se persiste

### Escenario: Editar nombre
  Cuando envía PATCH name
  Entonces se actualiza y el slug NO cambia (estable)

## Tareas técnicas

- [ ] Endpoints `src/pages/api/v1/admin/trades/index.ts`, `[id].ts`, `reorder.ts`
- [ ] Componente `src/components/admin/TradesManager.astro` con drag-drop
- [ ] Tests `tests/integration/admin/trades.test.ts`

> **Decisión:** agregar `category TEXT` al schema `trades` (valores: 'hogar' | 'tecnologia' | 'automotriz' | 'educacion' | 'salud_belleza' | 'otros'). Actualizar endpoint POST/PATCH para aceptar `category`. Agregar índice en `category` para mejorar filtros.

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
