# Propuesta — HU-09.1 — Schema reviews + review_responses

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

Las reseñas son la prueba social principal de la plataforma. Necesitamos dos tablas: `reviews` (la reseña en sí) y `review_responses` (la respuesta única del prestador). Las restricciones críticas son: `rating BETWEEN 1 AND 5`, `status IN ('visible','hidden')`, `UNIQUE(user_id, provider_id)` (un vecino no puede reseñar dos veces al mismo prestador), y FK con `ON DELETE CASCADE` para que la baja de un prestador o un usuario limpie sus reseñas. Vínculo con OE1 (engagement) y OE2 (filtros de calidad).

## Mockups de referencia

- HU 100% backend (DDL). No tiene UI directa. Las HUs siguientes consumen este schema.
  - `mockups/profile.html:84-89` — header con rating y contador "trabajos realizados" (consumido por HU-09.5).
  - `mockups/profile.html:191-199` — template de review en el perfil (consumido por HU-07.4).

## Alternativas consideradas

### Opcion A — Dos tablas separadas con FK 1-a-1 entre `review_responses` y `reviews`
- `reviews` con UNIQUE(user_id, provider_id); `review_responses` con PK = review_id (relación 1-a-1 estricta).
- Pro: relación clara, índices simples.
- Pro: la respuesta no existe hasta que el prestador responde; no hay fila "vacía".
- Contra: requiere JOIN para mostrar la respuesta; aceptable.

### Opcion B — Tabla única `reviews` con columna `response_body` nullable
- Una sola tabla con `response_body TEXT NULL`, `response_created_at INTEGER NULL`.
- Pro: una sola query para todo.
- Contra: las constraints de respuesta (HU-09.4: max 500 chars, created_at <= edited_until de la review) son más difíciles de modelar en CHECKs.
- Contra: si en el futuro se permite responder más de una vez (HU futura), la migración es dolorosa.

### Opcion C — Tabla `review_responses` separada pero con `id` propio + UNIQUE(review_id)
- `review_responses(id PK, review_id UNIQUE, body, created_at)`.
- Pro: permite crecimiento futuro (e.g. respuestas de admin) sin migración.
- Contra: para esta HU el PK = review_id es suficiente; PK separada es over-engineering.

## Decision

Se elige **Opcion A**. PK de `review_responses` es `review_id` (relación 1-a-1 estricta); CHECK constraints sobre `rating` y `status`. La doble tabla permite que HU-09.4 (respuesta) tenga sus propias validaciones sin tocar el schema de reseñas.

## Riesgos y mitigaciones

- Riesgo: rating NULL pasa el CHECK si no es NOT NULL → Mitigación: `rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)`.
- Riesgo: soft-delete de prestador deja reseñas huérfanas en queries → Mitigación: el resolver de HU-07.1 ya filtra `status != 'deleted'`; las queries acá filtran por `provider_id` válido (no por status del prestador, para evitar JOIN doble).
- Riesgo: UNIQUE(user_id, provider_id) bloquea edición (no creación) → Mitigación: la edición usa UPDATE, no INSERT; el UNIQUE no aplica.
- Riesgo: reseñas con `edited_until` NULL → Mitigación: `edited_until INTEGER NOT NULL` (default = created_at + 7 días).

## Metrica de exito

- `docker exec quien-sabe-app bun run db:migrate:local` aplica la migración sin errores.
- INSERT con `rating=6` → falla con `CHECK constraint failed: rating`.
- INSERT con `status='otro'` → falla con `CHECK constraint failed: status`.
- INSERT de segunda reseña mismo `(user_id, provider_id)` → falla con `UNIQUE constraint failed`.
- `EXPLAIN QUERY PLAN SELECT * FROM reviews WHERE provider_id=? AND status='visible' ORDER BY created_at DESC LIMIT 11` → usa `idx_reviews_provider_visible_created`.
