# Propuesta — HU-05.5 — Activar y desactivar servicios

**Estado:** propuesta | **REQ padre:** REQ-05-catalogo-servicios

## Contexto

El prestador necesita pausar un servicio temporalmente (vacaciones,
sobrecarga de trabajo, material escaso) sin perder los datos. El campo
`services.status` ya existe en HU-05.1 con enum `active|inactive`. La
HU sólo agrega la lógica para que (a) el toggle funcione vía PATCH
(ya extendido en HU-05.2) y (b) la búsqueda pública (REQ-06) excluya
los inactivos.

## Mockups de referencia

- `mockups/dashboard-provider.html:198-225` — "Mis Servicios Activos" con botones de pencil/delete. El toggle activar/desactivar se monta como switch o badge adicional (mockup no tiene explícitamente; decisión de diseño en HU-12).

## Alternativas consideradas

### Opcion A — Reusar `PATCH /api/v1/providers/me/services/[id]` con `{status: 'inactive'}` y filtrar `WHERE status = 'active'` en `queryBuilder` de búsqueda
- HU-05.2 ya acepta `status` en el patch.
- HU-06.1 ya filtra por `status='active'` por default (el escenario "Servicio inactivo no aparece en búsqueda" del hu.md ya está implícito en HU-06.1).
- Esta HU formaliza el contrato y agrega tests que verifican ambos lados.
- Pro: cero endpoints nuevos; un solo lugar para cambiar lógica de status.
- Pro: el filtro de búsqueda es trivial de testear.

### Opcion B — Endpoint dedicado `POST /api/v1/providers/me/services/[id]/toggle`
- Action explícito.
- Pro: semánticamente claro.
- Contra: duplica la lógica del PATCH; complica el cliente (PATCH ya basta).

### Opcion C — Soft-delete con `status='deleted'` (nuevo enum)
- Diferenciar "pausado" de "borrado".
- Pro: history completo.
- Contra: agrega un valor al enum; semánticamente confunde "borrado" con "soft-delete de perfil".

## Decision

Se elige **Opcion A**. El `PATCH` ya soporta el cambio de status desde
HU-05.2; HU-06.1 ya excluye por status en sus queries; esta HU
garantiza que ambos lados están conectados con tests de regresión.

## Riesgos y mitigaciones

- Riesgo: filtro en `queryBuilder` de HU-06.1 filtra también `status='inactive'` por accidente y un prestador que quiere ver sus servicios inactivos en su dashboard no los ve → Mitigación: el filtro aplica SÓLO a queries públicas (`/api/v1/search`); el endpoint `/api/v1/providers/me/services` (HU-05.2) devuelve TODOS los status al prestador dueño. Test explícito verifica esto.
- Riesgo: el prestador desactiva el último servicio activo y la búsqueda devuelve 0 resultados sin mensaje claro → Mitigación: UX feedback en dashboard ("Tienes 0 servicios activos — los vecinos no pueden encontrarte"); la búsqueda devuelve array vacío sin error.

## Metrica de exito

- `PATCH /api/v1/providers/me/services/7 {status: 'inactive'}` → 200, `services.status='inactive'`.
- `GET /api/v1/search?trade=gasfiter` con ese servicio inactivo → no lo incluye.
- Mismo endpoint con `status: 'active'` → vuelve a aparecer en búsqueda.
- `GET /api/v1/providers/me/services` SÍ incluye el servicio inactivo (el dueño lo ve siempre).
