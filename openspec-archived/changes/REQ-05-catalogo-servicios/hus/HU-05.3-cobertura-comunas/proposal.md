# Propuesta — HU-05.3 — Cobertura multi-comuna del servicio

**Estado:** propuesta | **REQ padre:** REQ-05-catalogo-servicios

## Contexto

Un servicio puede ofrecerse en varias comunas (ej: "Instalación de
calefón" en Las Condes, Vitacura y Lo Barnechea). La cobertura se
persiste en `service_coverage` (de HU-05.1) y se expone como un campo
más en el PATCH de servicio (HU-05.2). El reemplazo debe ser atómico:
si el cliente envía `[13114]` y el servicio tenía `[13114, 13123, 13109]`,
las tres anteriores se eliminan y queda sólo la nueva — sin estado
intermedio visible para otro request.

## Mockups de referencia

- HU mayormente backend. Componentes UI menores:
  - `mockups/index.html:336` — `<span class="neighbor-communes hidden">` con icono `ri-map-pin-line` muestra "Atiende en: <span></span>". El join `service_coverage → communes` rinde acá.
  - `mockups/dashboard-provider.html:198-225` — la sección de servicios es donde se monta el multi-select de comunas (futuro, fuera de scope de esta HU).

## Alternativas consideradas

### Opcion A — PATCH acepta `coverage_commune_ids`, delega a `replaceCoverage` con transacción Drizzle
- `db.transaction(async (tx) => { DELETE FROM service_coverage WHERE service_id = ?; INSERT INTO service_coverage ... })`.
- Pro: atómico; o se commitea todo, o nada.
- Pro: las comunas inválidas (no existen en `communes`) hacen fallar la transacción completa y devuelven 422.
- Contra: requiere que Drizzle wrappee bien la transacción en D1 (soportado via `db.transaction`).

### Opcion B — Diff manual: comparar `existing` vs `requested`, hacer DELETE para los que salen y INSERT para los que entran
- Sin transacción; cada DELETE/INSERT independiente.
- Pro: ahorra queries si el diff es chico.
- Contra: estado intermedio visible (otro request puede leer un set parcial); race conditions si dos PATCH concurrentes.

### Opcion C — Acumular (nunca eliminar) y usar flag `active` por fila
- `service_coverage (service_id, commune_id, active)`. PATCH marca activo/inactivo en vez de borrar.
- Pro: historial completo.
- Contra: complica queries de REQ-06; infla la tabla; el requisito pide reemplazo claro.

## Decision

Se elige **Opcion A**. La transacción Drizzle es la única opción que
cumple "atómico, no estado intermedio visible" sin sacrificar
simplicidad de queries posteriores. La validación de communes
existentes se hace con un `WHERE commune_id IN (...)` y se compara el
count contra el array recibido — si difiere, alguna no existe → 422.

## Riesgos y mitigaciones

- Riesgo: `IN (?)` con array vacío de Drizzle genera SQL inválido → Mitigación: si el array está vacío, hacer `DELETE FROM service_coverage WHERE service_id = ?` (sin inserts).
- Riesgo: D1 no soporta transacciones reales (es eventually consistent) → Mitigación: D1 SÍ soporta `db.transaction` con BEGIN/COMMIT en el mismo datacenter; verificar con test que simula concurrencia (insert + delete en transacción).
- Riesgo: commune con ID repetido en el array (`[13114, 13114]`) genera constraint violation por PK compuesta → Mitigación: dedupe el array en el handler antes de pasar al servicio.

## Metrica de exito

- `PATCH /api/v1/providers/me/services/7` con `{"coverage_commune_ids":[13114, 13123, 13109]}` → 200; `service_coverage` tiene 3 filas para `service_id=7`.
- Mismo endpoint con `[13114]` → las 3 anteriores se reemplazan atómicamente (un solo SELECT durante la transacción no debería ver el estado intermedio, testeable con spy).
- `coverage_commune_ids:[99999]` (no existe) → 422.
- `coverage_commune_ids:[]` → cobertura vacía (todas las filas anteriores borradas).
