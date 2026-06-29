# Propuesta — HU-09.6 — Moderación admin: ocultar reseña con motivo

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

Los administradores deben poder ocultar reseñas que violan las políticas (insultos, spam, datos personales). El ocultar debe dejar rastro de auditoría: el motivo queda en `hidden_reason` y la acción se registra en `admin_audit_log` (REQ-13). Una vez oculta, la reseña no aparece en el GET público (HU-07.4) ni en el cálculo del promedio (HU-09.5). El motivo es obligatorio para garantizar que la decisión es revisable.

## Mockups de referencia

- `mockups/dashboard-admin.html:225-264` — patrón de tabla admin con acciones (aprobar/rechazar). La sección de moderación de reseñas sigue este estilo (mockup a diseñar; referencia de patrón).
- `mockups/dashboard-admin.html:67-105` — KPIs admin (referencia general de estilo; no se materializa en esta HU).

## Alternativas consideradas

### Opcion A — Endpoint admin con PATCH atómico + audit log en misma transacción
- PATCH `/api/v1/admin/reviews/:id/hide` con `{ reason }`. UPDATE `reviews` + INSERT `admin_audit_log` en transacción.
- Pro: si el audit log falla, la ocultación hace rollback; garantiza consistencia.
- Pro: simple.
- Contra: requiere tabla `admin_audit_log` (REQ-13).

### Opcion B — Soft-delete separado: dejar `status='visible'` y agregar `hidden_by_admin_id`
- No cambiar `status`, agregar flag.
- Pro: reversible sin perder la marca.
- Contra: complica queries (siempre hay que filtrar `WHERE hidden_by_admin_id IS NULL`).
- Contra: la fila nunca vuelve a aparecer si el admin se equivoca y luego quiere restaurar.

### Opcion C — Borrar la reseña completamente
- Pro: cero storage.
- Contra: pierde evidencia para apelación; anti-transparencia; rechazada.

## Decision

Se elige **Opcion A**. La tabla `admin_audit_log` ya está prevista en REQ-13; este PR la usa con un evento `review_hidden`. La transacción garantiza atomicidad. La reversibilidad queda como REQ futuro (HU-09.6-extensión).

## Riesgos y mitigaciones

- Riesgo: el admin oculta y luego quiere restaurar → Mitigación: por ahora no hay restore; documentado. La fila sigue en DB con `status='hidden'`, no se borra.
- Riesgo: motivo vacío → Mitigación: Zod rechaza con 422.
- Riesgo: admin oculta una reseña que ya estaba oculta → Mitigación: idempotente: si ya está `hidden`, sólo actualiza `hidden_reason` y registra otro evento de audit.
- Riesgo: caché edge del perfil no se invalida → Mitigación: PATCH emite `cache.purge('/p/<slug>')` (best-effort, fuera de scope crítico); el TTL 60s ya cubre.

## Metrica de exito

- PATCH con sesión admin + motivo válido → 200 + `reviews.status='hidden'`, `hidden_reason='<motivo>'`.
- PATCH con motivo vacío → 422.
- PATCH sin sesión → 401.
- PATCH con sesión vecino → 403.
- PATCH con sesión admin sobre reseña inexistente → 404.
- Tras PATCH, GET público (HU-07.4) no incluye la reseña.
- Tras PATCH, el promedio de reseñas (HU-09.5) no incluye la reseña oculta.
- `SELECT * FROM admin_audit_log WHERE event='review_hidden'` retorna la fila con `actor_id`, `target_id`, `reason`, `created_at`.
