# Propuesta — HU-05.1 — Schema services y service_coverage

**Estado:** propuesta | **REQ padre:** REQ-05-catalogo-servicios

## Contexto

REQ-05 modela el catálogo de servicios que ofrece un prestador. Cada
servicio es una fila con precio, descripción y unidad (`hora|visita|proyecto`).
La zona de cobertura se modela aparte (`service_coverage`) porque un
servicio puede atender varias comunas. El modelo debe permitir: (a)
ordenar manualmente (`sort_order` entero), (b) activar/desactivar sin
borrar (`status` enum), (c) cascade delete desde `providers` para no
dejar huérfanos cuando un prestador se elimina físicamente (soft-delete
de HU-04.2 NO aplica cascade — preserva FK).

## Mockups de referencia

- HU 100% backend (DDL). No tiene UI directa. Los datos se consumen desde:
  - `mockups/dashboard-provider.html:198-225` — sección "Mis Servicios Activos" con precio `$15.000`, `$25.000` por servicio. La columna `price_clp` se renderiza acá.
  - `mockups/index.html:349-352` — `services-container` en cada card muestra los tags de servicio (referencia para HU-06.1 que consulta esta tabla).

## Alternativas consideradas

### Opcion A — Dos tablas: `services` + `service_coverage` con FKs explícitas
- `services` con `provider_id`, `title`, `description`, `price_clp`, `unit`, `sort_order`, `status`, timestamps.
- `service_coverage` con clave compuesta `(service_id, commune_id)`, FK a `services` con `ON DELETE CASCADE` y a `communes` con `ON DELETE RESTRICT`.
- Pro: queries claras para REQ-06 (`JOIN service_coverage ON ... WHERE commune_id = ?`).
- Pro: `CHECK (price_clp >= 0)` o `> 0` resuelve el criterio "precio positivo" en la tabla.
- Contra: dos migraciones coordinadas.

### Opcion B — `services` con columna `coverage_communes TEXT` (CSV de IDs)
- Una sola tabla, cobertura como CSV.
- Pro: 1 tabla, 1 query.
- Contra: imposible filtrar con JOIN — REQ-06 (búsqueda por comuna) requiere JOIN o `LIKE '%ID%'` (caro, error-prone).
- Contra: CHECK de communes existentes requiere parser CSV en trigger.

### Opcion C — JSON `coverage_commune_ids` en `services`
- Pro: flexible para añadir campos sin migración.
- Contra: pierde la garantía de FK a communes; cualquier ID basura entra silenciosamente.

## Decision

Se elige **Opcion A**. El modelado relacional es la única opción que
cumple el criterio "filtro por comuna" de REQ-06 con buen rendimiento
y mantiene integridad referencial explícita. El costo de dos tablas
es marginal.

## Riesgos y mitigaciones

- Riesgo: `sort_order` único por prestador requiere coordinación → Mitigación: NO usar `UNIQUE(provider_id, sort_order)`; usar `sort_order` como entero con gaps permitidos. HU-05.2 crea servicios con `(max(sort_order) + 1)` o `0`. HU-05.4 reasigna en bloque.
- Riesgo: cascade de `services` elimina `service_coverage` al borrar prestador físicamente, pero el soft-delete no debe hacerlo → Mitigación: documentar que soft-delete (`status='deleted'`) deja filas intactas; el cascade aplica sólo en `DELETE FROM providers` (no usado en flujo normal).
- Riesgo: precio 0 malicioso → Mitigación: CHECK `price_clp > 0` (no `>= 0`); "consultar" se modela con `price_clp = null` y un check separado.

## Metrica de exito

- La migración aplica en D1 local sin errores: `docker exec quien-sabe-app bun run db:migrate:local`.
- `INSERT INTO services (price_clp) VALUES (-10)` falla por CHECK.
- Eliminar físicamente un `provider` con 3 servicios → sus 3 filas en `services` y `service_coverage` desaparecen.
- `EXPLAIN QUERY PLAN` sobre `WHERE provider_id = ? AND status = 'active'` usa índice por `provider_id`.
