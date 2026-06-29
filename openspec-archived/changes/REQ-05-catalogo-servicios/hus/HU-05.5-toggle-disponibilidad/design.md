# Diseno tecnico — HU-05.5 — Activar y desactivar servicios

**REQ padre:** REQ-05-catalogo-servicios

## Modelo de datos

No agrega tablas. Consume `services.status` (de HU-05.1).

## Contrato de API

### `PATCH /api/v1/providers/me/services/[id]`

Acepta `{status: 'active' | 'inactive'}` (ya extendido en HU-05.2 via `servicePatchSchema`).

**Response 200** — servicio actualizado.
**Response 403 / 404** — según ownership.

### `GET /api/v1/search?trade=...`

(De HU-06.1) Filtra `services.status = 'active'` en el JOIN.

## Validaciones Zod

Reusa `servicePatchSchema.status` de HU-05.2. No agrega schemas nuevos.

## Componentes UI

Esta HU es backend. El toggle visual (switch `active/inactive` por
servicio en el dashboard) se entrega en HU-12.

## Flujo de interaccion (secuencial)

**Toggle**:
1. Prestador clickea el switch en `/dashboard-provider`.
2. Front hace `PATCH /api/v1/providers/me/services/[id] { status: 'inactive' }`.
3. Handler Zod-valida, valida ownership.
4. `UPDATE services SET status = ?, updated_at = unixepoch() WHERE id = ? AND provider_id = ?`.
5. Devuelve 200.
6. Front actualiza el estado local.
7. Próxima `GET /api/v1/search?trade=<del prestador>` ya no incluye ese servicio.

**Búsqueda**:
1. Visitante llega a home → GET `/api/v1/search?trade=gasfiter`.
2. `queryBuilder` (HU-06.1) hace JOIN con `services` aplicando `WHERE services.status = 'active'`.
3. Devuelve items sin los inactivos.

## Capa de servicios

- `src/lib/services/services.ts` (extiende HU-05.2):
  - `updateService` ya soporta `status` (extensión de HU-05.2).
- `src/lib/services/search/queryBuilder.ts` (de HU-06.1):
  - El builder incluye `WHERE s.status = 'active'` en el JOIN con `services` para queries públicas.
  - Las queries "internas" del prestador (no son parte de `queryBuilder`) NO filtran.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/services/toggle.test.ts` | PATCH `status: 'inactive'` → 200, fila actualizada; PATCH `status: 'active'` → 200, fila reactivada |
| Integracion | `tests/integration/search/excludes-inactive.test.ts` | Seed: 1 prestador con 1 servicio activo + 1 inactivo. `GET /api/v1/search` retorna sólo el activo. `GET /api/v1/providers/me/services` (del prestador dueño) retorna ambos |
| Unit | `tests/unit/search/queryBuilder.test.ts` (de HU-06.1, extiende) | Verificar que el builder aplica `WHERE s.status = 'active'` cuando se construye para query pública |

## Dependencias y secuencia

- **Bloqueado por:** HU-05.2 (PATCH endpoint), HU-05.1 (schema con `status`), HU-06.1 (`queryBuilder` base).
- **Bloquea a:** nada crítico; HU-06.7 (suite de aceptación) la incluye como caso.
- **Recursos compartidos:** `src/lib/services/search/queryBuilder.ts`.

## Riesgos tecnicos

- Riesgo: el filtro `status='active'` se aplica también a la query interna del dashboard y rompe el caso "dueño ve sus inactivos" → Mitigación: tests explícitos para ambas rutas; `queryBuilder` recibe un flag `includeInactive` que por default es `false`.
- Riesgo: si HU-06.1 no aplica el filtro, esta HU no se entera → Mitigación: el test `tests/integration/search/excludes-inactive.test.ts` falla si HU-06.1 no está mergeada correctamente.
