# Diseno tecnico — HU-06.3 — Paginación cursor-based estable

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No agrega tablas. Requiere índice sobre `(created_at DESC, id DESC)` en `providers`. Si la migración `0002_providers_trades.sql` de HU-04.1 no lo incluye, agregar en T1:

```sql
CREATE INDEX idx_providers_created_id ON providers(created_at DESC, id DESC);
```

## Contrato de API

Extiende `GET /api/v1/search`. Acepta:
- `cursor` (opaque string) — HU-06.3 implementa.
- `limit` (int 1..50) — ya en HU-06.1.

**Cursor encoding**:
- Estructura: `{ c: number /* unixepoch seg */, i: number /* id */ }`.
- Codificación: `base64url(JSON.stringify(payload))`.

**Cursor decoding** (validación):
- Si no es base64url válido → 400.
- Si no parsea a JSON con shape correcto → 400.
- Si `c` o `i` no son números positivos → 400.

**Cambio en el SQL del builder** (sólo con `sort=recent` o default):
```sql
ORDER BY providers.created_at DESC, providers.id DESC
LIMIT ?
-- si hay cursor:
WHERE (providers.created_at < ? OR (providers.created_at = ? AND providers.id < ?))
```

## Validaciones Zod

```ts
// src/lib/utils/cursor.ts
export function encodeCursor(payload: { c: number; i: number }): string
export function decodeCursor(cursor: string): { c: number; i: number }
```

Helper de validación que tira `CursorInvalidError` (mapeada a 400 en el handler).

## Componentes UI

Esta HU es backend. La UI "Cargar más" / paginación se entrega en HU-06.6.

## Flujo de interaccion (secuencial)

**Página 1**:
1. Front hace `GET /api/v1/search?trade=gasfiter&limit=10`.
2. Handler corre query sin WHERE de cursor.
3. Si `items.length === limit`, encodea último item `{ c: createdAt, i: id }` y devuelve como cursor.
4. Si `items.length < limit`, devuelve `cursor: null` (fin de resultados).

**Página N**:
1. Front hace `GET /api/v1/search?...&cursor=<opaque>&limit=10`.
2. Handler decodifica cursor (Zod + helper).
3. Si inválido → 400.
4. `queryBuilder` agrega WHERE keyset sobre `(created_at, id)`.
5. Misma lógica para el siguiente cursor.

**Fin**:
1. Si `items.length < limit` → `cursor: null`.
2. Front deja de mostrar "Cargar más".

## Capa de servicios

- `src/lib/utils/cursor.ts`:
  - `encodeCursor({ c, i })` — base64url.
  - `decodeCursor(cursor)` — base64url + JSON parse + Zod.
  - `CursorInvalidError` — error tipado.
- `src/lib/services/search/queryBuilder.ts` (extiende):
  - `applyCursor(sql, cursor)` agrega `WHERE (created_at < ? OR (created_at = ? AND id < ?))` cuando cursor presente.
  - `buildSearchQuery` retorna también el siguiente cursor basado en el último item.
- `src/lib/services/search/search.ts` (extiende):
  - `searchProviders` recibe cursor, lo pasa al builder, encodea el cursor resultante.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/cursor.test.ts` | encode/decode round-trip; cursor corrupto tira `CursorInvalidError`; cursor con shape inválido tira |
| Unit | `tests/unit/search/queryBuilder.test.ts` (extiende) | SQL contiene keyset WHERE cuando cursor presente; no contiene cuando null |
| Integracion | `tests/integration/search/pagination.test.ts` | 25 prestadores seed; página 1 + página 2 cubren los 20 sin duplicados; última página tiene `cursor=null`; cursor corrupto 400 |
| Integracion | `tests/integration/search/pagination-concurrent.test.ts` | Insert entre página 1 y página 2 → ningún prestador original se duplica ni se pierde |

## Dependencias y secuencia

- **Bloqueado por:** HU-06.1 (endpoint base), HU-04.1 (schema `providers.created_at`).
- **Bloquea a:** HU-06.6 (UI "Cargar más"), HU-06.7 (suite de aceptación cubre paginación).
- **Recursos compartidos:** `src/lib/utils/cursor.ts`.

## Riesgos tecnicos

- Riesgo: orden por `(created_at, id)` puede producir empates si dos providers se crean en el mismo segundo → Mitigación: el `id` como segundo criterio de orden resuelve los empates; `id` es autoincrement único.
- Riesgo: indexar `(created_at DESC, id DESC)` no se usa si la query filtra mucho antes → Mitigación: bench en HU-06.7 verifica que el planner usa el índice para sort.
- Riesgo: cliente envía cursor de otra sesión o con IDs manipulados → Mitigación: el cursor es sólo una "posición", no autoriza acceso a nada; no hay riesgo de seguridad.
