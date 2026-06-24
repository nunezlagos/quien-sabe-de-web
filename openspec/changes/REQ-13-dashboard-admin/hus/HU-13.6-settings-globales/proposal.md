# Propuesta — HU-13.6 — Settings globales editables

**Estado:** propuesta | **REQ padre:** REQ-13-dashboard-admin

## Contexto

Hay parámetros que el admin debe poder ajustar sin redeploy: rate-limits (cuántos contactos por IP/hora), SLAs de tickets (horas para primera respuesta), versiones de mensajes legales, flags operacionales (sampling de auditoría, TTL de cache). Hoy están hardcodeados en el código. Proponemos una tabla `settings` key-value con JSON para flexibilidad, un endpoint admin para leer/escribir, y un cache KV invalidated al escribir.

## Mockups de referencia

- `mockups/dashboard-admin.html:276-282` — placeholder "Configuración — Próximamente". Esta HU lo implementa.

## Alternativas considered

### Opcion A — Tabla `settings (key PK, value_json, updated_by, updated_at)` + cache KV
- Una fila por setting. `value_json` permite tipos heterogéneos (string, number, bool).
- Pro: schema simple, flexible.
- Pro: historial via `updated_at` (no hace falta tabla aparte).
- Contra: cada setting requiere su propio Zod schema (no hay type-safety a nivel SQL).

### Opcion B — Tabla `settings` con columnas tipadas (`value_number`, `value_string`, `value_bool`)
- Pro: type-safety per columna.
- Contra: una columna por tipo; combinaciones se vuelven nulas; rígido.

### Opcion C — Settings como JSON en KV (sin tabla)
- Pro: cero schema.
- Contra: sin auditoría (quién cambió qué y cuándo); sin queries SQL (ej: "todos los settings actualizados en los últimos 30 días").

## Decision

Se elige **Opcion A**. Una tabla con `value_json TEXT` y un map de Zod schemas por key (`settingSchemaByKey`) garantiza validación tipada en runtime y mantiene un audit trail mínimo (updated_by + updated_at). El cache KV `settings:current` se invalida en cada PATCH.

## Riesgos y mitigaciones

- Riesgo: el admin setea un valor inválido (ej: `rate_limit_contact: -1`) → Mitigación: cada key tiene su Zod schema específico; PATCH devuelve 422 con detalle.
- Riesgo: el cambio impacta toda la app y no se refleja inmediatamente → Mitigación: el cache KV se invalida explícitamente; el siguiente read reconstruye.
- Riesgo: schema cambia y el JSON viejo no parsea → Mitigación: cada Zod schema es versionado por key (`rate_limit_contact_v1`); al desplegar v2, el servicio detecta versión incompatible y rechaza con 409.

## Metrica de exito

- GET `/api/v1/admin/settings` → 200 con objeto tipado de todos los settings conocidos.
- PATCH `{"rate_limit_contact": 50}` → 200, fila en `settings` actualizada, audit log, cache KV invalidado.
- PATCH `{"rate_limit_contact": -1}` → 422 con detalle Zod.
- E2E: admin cambia setting → próxima request lo refleja (cache invalidated).
