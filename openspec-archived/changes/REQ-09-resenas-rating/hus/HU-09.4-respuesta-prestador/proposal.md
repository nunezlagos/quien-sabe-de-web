# Propuesta — HU-09.4 — Respuesta única del prestador a una reseña

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

Una vez que un prestador recibe una reseña, debe poder responder públicamente con su versión. La relación es 1-a-1 estricta: una reseña tiene cero o una respuesta. Esto se modela con PK = `review_id` en `review_responses` (HU-09.1), lo que hace imposible una segunda respuesta por constraints de DB. La respuesta es autoría del prestador dueño de la reseña, no del autor de la reseña. La respuesta debe aparecer en el GET público (HU-07.4) para que los visitantes la lean.

## Mockups de referencia

- `mockups/profile.html:151-159` — sección donde se renderiza la respuesta bajo la reseña.
- `mockups/dashboard-provider.html` — UI donde el prestador verá sus reseñas pendientes de responder (referencia; REQ-12 lo implementa).

## Alternativas consideradas

### Opcion A — POST `/reviews/:id/response` con PK = review_id y validación de autoría
- Endpoint POST que valida sesión de prestador dueño de la reseña.
- INSERT en `review_responses` con `review_id` como PK. Si falla por PK duplicado → 409.
- Pro: PK es la fuente de verdad del 1-a-1; no hay race condition.
- Pro: simple.
- Contra: una vez creada la respuesta, no hay update (sólo delete + re-create, que está fuera de scope).

### Opcion B — UPSERT en `review_responses`
- INSERT OR REPLACE.
- Pro: permite "editar" la respuesta.
- Contra: contradice "una respuesta por reseña"; si se permite update, ¿cuál es la semántica? ¿se reinicia el freeze de edición de la reseña? Decisión fuera de scope.

### Opcion C — Permitir múltiples respuestas (hilo)
- `review_responses(id PK, review_id, created_at)`.
- Pro: más flexible.
- Contra: contradice el criterio explícito "una respuesta".

## Decision

Se elige **Opcion A**. PK = review_id es la fuente de verdad del 1-a-1. El 409 es por constraint, no por chequeo previo (más simple y a prueba de races).

## Riesgos y mitigaciones

- Riesgo: prestador A responde reseña dirigida al prestador B → Mitigación: validar que `review.provider_id === session.providerId`; 403 si no.
- Riesgo: prestador sin `providerId` en sesión (rol user/admin) responde → Mitigación: `requireProviderSession` + chequeo explícito; 403 si no.
- Riesgo: body excede 500 chars → Mitigación: Zod + CHECK en DB.
- Riesgo: reseña oculta (`status='hidden'`) → Mitigación: el prestador no debería responder una reseña oculta; 403 con mensaje claro.
- Riesgo: el `INSERT OR FAIL` por PK duplicado devuelve error genérico de SQLite → Mitigación: capturar `SQLITE_CONSTRAINT_PRIMARYKEY` y mapear a 409.

## Metrica de exito

- POST con sesión prestador dueño + body válido → 201 + fila en `review_responses`.
- POST con segunda respuesta a la misma reseña → 409 `error: "reseña ya tiene respuesta"`.
- POST de prestador A a reseña de prestador B → 403 `error: "no es tu reseña"`.
- POST sin sesión → 401.
- POST con body de 501 chars → 422.
- GET público de la reseña del prestador (HU-07.4) → cada item incluye `response: { body, createdAt } | null`.
