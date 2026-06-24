# Propuesta — HU-18.1 — Schema events_log con índices

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

Necesitamos persistir todos los eventos de producto (signup, search, contact, review, donation, ticket_open) en una tabla normalizada de D1 para sustentar agregaciones internas y el dashboard admin. Esta HU es el cimiento de OE1/OE2/OE3: sin la tabla y sus índices, las consultas de KPI (HU-18.5) y el listado de debug (HU-18.6) no pueden ejecutarse en tiempo razonable.

## Mockups de referencia

HU 100% backend (capa de datos). No hay mockup directo. Los consumidores de esta tabla se ven en:

- `mockups/dashboard-admin.html:67-105` — bloque de KPIs que se alimentará de agregaciones sobre `events_log`.
- `mockups/dashboard-admin.html:107-143` — bar chart "Visitas Semanales" que en producción se calcula con `COUNT(*) WHERE event=...` agrupado por día.

## Alternativas consideradas

### Opción A — Tabla única `events_log` con `props_json` libre y CHECK sobre `event`
- Una tabla, columnas mínimas, `event` validado por CHECK enum, `props_json` como `TEXT` con validación `json_valid()`.
- Pro: simple, una sola migración, queries directas, fácil retención por `created_at`.
- Contra: `props_json` no tipado a nivel SQL; sanidad la fuerza el endpoint (HU-18.3).

### Opción B — Tabla por evento (events_search, events_signup, etc.)
- Una tabla por tipo de evento con columnas tipadas.
- Pro: tipado estricto en DB.
- Contra: 6 tablas, 6 migraciones, joins/uniones complejas para dashboard global, costo alto para agregar un evento nuevo.

### Opción C — Solo Cloudflare Analytics Engine sin D1
- Confiar 100% en CF Analytics Engine.
- Pro: cero costo de mantenimiento de schema.
- Contra: la HU padre exige `events_log` D1 como fallback (riesgo del REQ-18); planes CF varían, y queries SQL ad-hoc no están disponibles sobre Analytics Engine.

## Decisión

Se adopta **Opción A**. Es la única coherente con la "Superficie técnica" del REQ-18 (tabla `events_log`) y con los criterios Gherkin de la HU (CHECK enum + `json_valid`). La doble emisión a Analytics Engine se cubre en HU-18.4 sin tocar este schema.

## Riesgos y mitigaciones

- Crecimiento de filas → política de retención 90 días vía job/cron futuro; índice `(event, created_at desc)` mantiene queries baratos.
- `props_json` sin esquema en DB → validación obligatoria por Zod en HU-18.3 antes del insert.
- CHECK enum rígido al agregar eventos → migración correctiva documentada como parte del flujo de "nuevo evento".

## Métrica de éxito

- La migración aplica limpia en local (`db:migrate:local`) y los tests de integración (`tests/integration/events/schema.test.ts`) verifican: tabla creada, índices presentes, CHECK rechaza eventos inválidos, `json_valid` rechaza strings no-JSON.
