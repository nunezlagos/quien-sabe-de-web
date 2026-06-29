# Propuesta — HU-09.3 — Editar reseña dentro de 7 días

**Estado:** propuesta | **REQ padre:** REQ-09-resenas-rating

## Contexto

Una reseña puede contener errores o reflejar una experiencia que cambió. El vecino debe poder corregirla, pero la ventana debe ser corta (7 días) para evitar manipulación post-respuesta del prestador. Además, una vez que el prestador responde, la edición se congela: si la respuesta ya está publicada, editar la reseña sería deshonesto. La lógica de "puedo editar?" depende de (a) la ventana temporal, (b) la autoría, y (c) la existencia de respuesta.

## Mockups de referencia

- `mockups/profile.html:151-159` — sección donde se renderiza la reseña editada.
- `mockups/dashboard-user.html` (no leído línea por línea; referenciado por la HU para "Mis reseñas").

## Alternativas consideradas

### Opcion A — Helper `canEditReview(review)` puro + endpoint PATCH con chequeo explícito
- Función pura que retorna `true|false|'frozen_by_response'`.
- Endpoint que la invoca y mapea a 200 / 403 / 409.
- Pro: la lógica es testeable unitariamente sin DB.
- Pro: una sola fuente de verdad para futuras reglas (e.g. edición por admin).
- Contra: hay que sincronizar la lógica con `edited_until` real.

### Opcion B — Toda la lógica en el endpoint, sin helper
- Pro: menos archivos.
- Contra: no testeable de forma pura; cualquier cambio de regla toca el endpoint.

### Opcion C — Permitir editar siempre (sin ventana)
- Pro: máxima flexibilidad.
- Contra: contradice criterio explícito de aceptación.

## Decision

Se elige **Opcion A**. El helper `canEditReview` se testea con casos puros (reloj mockeado, respuesta mockeada). El endpoint es delgado.

## Riesgos y mitigaciones

- Riesgo: el reloj del servidor cambia entre check y UPDATE → Mitigación: usar `Date.now()` en el endpoint, no confiar en el cliente.
- Riesgo: la respuesta se crea entre el check de `canEditReview` y el UPDATE → Mitigación: usar transacción con `SELECT ... FOR UPDATE` (D1 no lo soporta) o aceptar la race; documentar el trade-off.
- Riesgo: el body editado excede 1000 chars → Mitigación: Zod rechaza con 422.
- Riesgo: la reseña está oculta (`status='hidden'`) → Mitigación: el helper retorna `false` (no se puede editar reseña oculta); 403 con mensaje claro.

## Metrica de exito

- PATCH a reseña con `created_at = ahora - 3 días` → 200 con campos actualizados.
- PATCH a reseña con `created_at = ahora - 8 días` → 403 con `error: "edición fuera de ventana"`.
- PATCH a reseña de otro usuario → 403 con `error: "no es tu reseña"`.
- PATCH a reseña con respuesta del prestador → 409 con `error: "edición bloqueada por respuesta"`.
- PATCH con body de 1001 chars → 422.
- PATCH con rating 0 → 422.
