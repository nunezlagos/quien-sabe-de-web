# HU-06.3 — Paginación cursor-based estable

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** cliente de búsqueda
**Quiero** paginar resultados con un cursor estable
**Para** que no haya duplicados ni saltos cuando se insertan filas concurrentes

## Criterios de aceptación (Gherkin)

### Escenario: Primera página devuelve cursor
  Dado 25 prestadores que matchean
  Cuando envío `GET /api/v1/search?trade=gasfiter&limit=10`
  Entonces recibo `{ items: [...10], cursor: "<opaque>" }`

### Escenario: Página siguiente con cursor
  Cuando envío `GET /api/v1/search?trade=gasfiter&limit=10&cursor=<opaque>`
  Entonces recibo los siguientes 10 sin duplicar los primeros

### Escenario: Cursor corrupto → 400
  Cuando envío `cursor=abc%xyz`
  Entonces recibo status 400 con `{ "error": "cursor inválido" }`

### Escenario: Insert concurrente no rompe paginación
  Dado 20 prestadores y se inserta un 21 entre página 1 y página 2
  Cuando se pagina con cursor
  Entonces ninguno de los 20 originales se duplica ni se saltea

## Tareas técnicas

- [ ] Helper `encodeCursor({ created_at, id })` y `decodeCursor` en `src/lib/utils/cursor.ts`
- [ ] Ordenamiento estable por `(created_at desc, id desc)` con keyset pagination
- [ ] Tests `tests/unit/utils/cursor.test.ts`, `tests/integration/search/pagination.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
