# Propuesta — HU-08.1 — Schema contact_events con índices

**Estado:** propuesta | **REQ padre:** REQ-08-contacto-tracking

## Contexto

Necesitamos persistir cada contacto efectivo (clic en WhatsApp, llamada o email) en una tabla dedicada para alimentar la métrica OE2 (5.000 contactos año 1, 25.000 año 2). El esquema debe permitir agregados rápidos por prestador y por rango temporal sin guardar PII del solicitante: sólo `provider_id`, `kind`, `ip_hash`, `ua_hash` y `created_at`. Vínculo directo a OE2.

## Mockups de referencia

- HU 100% backend (DDL). No tiene UI directa. Los datos se consumen desde:
  - `mockups/dashboard-provider.html:83-86` — KPI "Contactos" del prestador (HU-08.4). UI a diseñar siguiendo este estilo.
  - `mockups/dashboard-admin.html:67-105` — grilla de KPIs admin (HU-08.5). UI a diseñar siguiendo este estilo.

## Alternativas consideradas

### Opcion A — Tabla dedicada `contact_events` con índices compuestos
- Tabla SQLite (D1) con columnas mínimas y dos índices: `provider_id` y `(provider_id, created_at DESC)`.
- Pro: consultas por prestador y por rango temporal en O(log n).
- Pro: aislamiento claro respecto a `providers` y otras tablas de dominio.
- Contra: requiere mantener migración y, eventualmente, particionado o limpieza por antigüedad.

### Opcion B — Reutilizar tabla genérica `analytics_events`
- Una sola tabla con `event_type`, `entity_id`, `payload JSON` para todas las métricas del sistema.
- Pro: menos migraciones futuras para nuevos tipos de evento.
- Contra: índices genéricos rinden peor para consultas de OE2 con filtros muy específicos.
- Contra: dificulta el `CHECK` sobre `kind` y abre la puerta a payloads que filtren PII por descuido.

## Decision

Se elige **Opcion A**. Una tabla dedicada con `CHECK` sobre `kind` cumple los criterios de aceptación (validación enum, índices, ausencia de PII) y deja KV libre para lo que realmente necesita baja latencia (rate limit, sesiones). El costo de migración es marginal frente al beneficio de queries explícitas y verificables.

## Riesgos y mitigaciones

- Riesgo: crecimiento ilimitado de la tabla → Mitigación: tarea futura (REQ aparte) de archivado o agregados mensuales tras 12 meses.
- Riesgo: salt rotativo desincroniza hashes históricos → Mitigación: guardar `ip_hash` con el salt vigente en el momento de la inserción; los agregados no requieren reversibilidad.
- Riesgo: `CHECK` sobre enum dificulta agregar nuevos kinds → Mitigación: documentar que ampliar el enum requiere migración nueva, no parche en runtime.

## Metrica de exito

- La migración aplica en D1 local sin errores: `docker exec quien-sabe-app bun run db:migrate:local`.
- Inserts con `kind` fuera de `whatsapp|phone|email` fallan con error de `CHECK`.
- `EXPLAIN QUERY PLAN` sobre `WHERE provider_id = ? AND created_at >= ?` usa el índice compuesto `(provider_id, created_at DESC)`.
