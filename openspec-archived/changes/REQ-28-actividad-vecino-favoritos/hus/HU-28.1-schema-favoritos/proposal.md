# Propuesta — HU-28.1 — Esquema user_favorites

**Estado:** propuesta | **REQ padre:** REQ-28-actividad-vecino-favoritos

## Contexto

El vecino debe poder marcar prestadores como favoritos y recuperarlos
luego en su dashboard. Esta HU sienta la base de persistencia (tabla,
índice, helper de listado) que consumen HU-28.2 (toggle desde UI) y
HU-28.3 (render de la sección "Vecinos Guardados"). Sin este schema no
hay nada que toggear ni listar. Vincula al objetivo OE2 (fidelización
del vecino).

## Mockups de referencia

- `mockups/dashboard-user.html:71-97` — sección "Vecinos Guardados" que
  consume el listado producido por el helper `listFavorites`.
- `mockups/dashboard-user.html:77` — avatar circular con inicial del
  nombre cuando no hay foto; confirma que el listado necesita exponer
  `nombre`, `inicial`, `avatar_url` y `oficio` desde el join con
  `providers`.

## Alternativas consideradas

### Opción A — Tabla dedicada `user_favorites` con PK compuesta
- Tabla con `(user_id, provider_id)` como clave primaria, columna
  `created_at` para ordenar por reciente y FK con cascade hacia `users`.
- Pro: integridad referencial garantizada; idempotencia por PK; índice
  natural para evitar duplicados.
- Contra: requiere migración nueva y mantener FK en sincronía con
  `users` y `providers`.

### Opción B — Columna JSON `favorites` dentro de `users`
- Guardar un array de `provider_id` dentro de un campo JSON del usuario.
- Pro: una sola tabla; sin migración estructural.
- Contra: imposible indexar `created_at` por par; sin integridad
  referencial frente a soft-delete del prestador; reescritura completa
  del array en cada toggle; difícil paginar.

## Decisión

Opción A. La PK compuesta da idempotencia gratis al toggle, el índice
`(user_id, created_at DESC)` resuelve el orden por recientes que pide el
mockup, y la separación en tabla propia permite agregar columnas
futuras (por ejemplo `note` o `pinned`) sin tocar `users`.

## Riesgos y mitigaciones

- Riesgo: borrar un `user` huérfana sus favoritos → Mitigación: FK con
  `ON DELETE CASCADE` hacia `users`.
- Riesgo: prestador soft-deleted aparece como favorito → Mitigación:
  filtrar `providers.deleted_at IS NULL` en `listFavorites` (no cascade
  en DB).
- Riesgo: doble insert por carrera → Mitigación: PK compuesta hace que
  el segundo `INSERT` falle con conflicto manejable como idempotente.

## Métrica de éxito

- `bunx tsc --noEmit` verde tras agregar `userFavorites` al schema.
- Migración aplica limpia en D1 local sin warnings.
- Helper `listFavorites(userId, limit)` devuelve resultados ordenados
  por `created_at DESC` y excluye prestadores soft-deleted.
- Cobertura ≥ 90 % en `tests/unit/favorites/schema.test.ts`.
