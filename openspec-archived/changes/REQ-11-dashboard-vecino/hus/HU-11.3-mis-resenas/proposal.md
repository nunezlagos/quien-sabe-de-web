# Propuesta — HU-11.3 — Listado de reseñas dejadas con CTA editar

**Estado:** propuesta | **REQ padre:** REQ-11-dashboard-vecino

## Contexto

El vecino debe poder revisar y editar sus reseñas dentro de la ventana permitida (REQ-09 establece 7 días desde la creación, sin respuesta del prestador). El dashboard necesita una tab "Mis reseñas" que muestre todas las reseñas propias con un indicador `editable` claro y un CTA inline que lleve al formulario de edición. Hoy la lógica de "puede editar" existe en REQ-09 pero no está centralizada en un helper reutilizable; la copiamos una vez acá y dejamos el helper `canEditReview` en un módulo compartido.

## Mockups de referencia

- `mockups/dashboard-user.html:99-112` — lista "Recientes" con ícono de búsqueda + texto gris. Adaptamos el patrón a filas de reseñas con la puntuación en estrella (reuso del componente de REQ-09) y un botón "Editar" cuando `editable=true`.

## Alternativas considered

### Opcion A — Endpoint dedicado `GET /api/v1/users/me/reviews` con payload `{ items: [...], editable_by_id: Set<number> }`
- Endpoint nuevo, tabla `reviews` (REQ-09) ya existe.
- Pro: aísla el contrato del dashboard de la API pública de reseñas.
- Pro: el frontend puede recibir un set de IDs editables y condicionar el CTA sin volver a pedir cada fila.
- Contra: duplica parte de la query de REQ-09, pero con `WHERE user_id = ?`.

### Opcion B — Reusar `GET /api/v1/providers/:slug/reviews` filtrando por autor en cliente
- Filtrar en cliente las reseñas cuyo `author.user_id` coincida con el usuario actual.
- Pro: cero endpoint nuevo.
- Contra: leak de reseñas de OTROS vecinos que también reseñaron al mismo prestador (privacidad rota); require fetch de TODAS las reseñas de cada prestador contactado (N+1).

### Opcion C — Single endpoint `/api/v1/users/me/activity` que devuelva contactos + reseñas en un payload
- Combina HU-11.2 y HU-11.3 en un único GET.
- Pro: menos requests.
- Contra: si el usuario abre "Historial" pero no "Mis reseñas", paga la query de reseñas; tampoco resuelve el problema de HU-11.2.

## Decision

Se elige **Opcion A**. Un endpoint dedicado filtra por `user_id` en el servidor (nunca en cliente) y devuelve un array simple. El helper `canEditReview(review, now)` se extrae a `src/lib/services/reviews/canEditReview.ts` para que REQ-09 (al editar) lo reuse.

## Riesgos y mitigaciones

- Riesgo: ventana de edición cambia en REQ-09 y se desincroniza con este helper → Mitigación: el helper recibe la ventana como parámetro (`windowDays = 7` por default) y un único test compartido verifica el comportamiento.
- Riesgo: el payload expone reseñas de otros autores si el WHERE se olvida → Mitigación: el test "cross-user" verifica explícitamente que el vecino B no ve reseñas de A.
- Riesgo: reseñas con respuesta del prestador bloquean edición pero el indicador visual no lo distingue → Mitigación: la API devuelve `editable: false` con flag opcional `has_provider_response: bool` para que la UI muestre "no editable (respondido)".

## Metrica de exito

- Vecino con 3 reseñas → GET `/api/v1/users/me/reviews` → recibe 3 items, cada uno con `editable` correcto.
- Reseña creada hace 2 días sin respuesta → `editable: true`.
- Reseña creada hace 9 días → `editable: false`.
- Vecino A NO ve reseñas de B en ningún escenario.
- E2E: tab "Mis reseñas" muestra CTA "Editar" sólo donde `editable=true`.
