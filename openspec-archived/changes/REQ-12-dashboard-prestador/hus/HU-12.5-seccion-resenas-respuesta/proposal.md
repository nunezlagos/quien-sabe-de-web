# Propuesta — HU-12.5 — Sección de reseñas recibidas con respuesta

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita ver todas las reseñas que ha recibido (incluyendo las ocultas por moderación, sólo visibles para él con un badge) y responder públicamente. Esto cierra el ciclo de reputación y sustenta OE1 al permitir interacción con clientes.

## Mockups de referencia

- `mockups/dashboard-provider.html:61` — link "Reseñas" en el sidebar.
- `mockups/profile.html:151-159` — sección "Opiniones" con `id="profile-reviews-container"` (patrón visual base para listar reseñas).
- `mockups/profile.html:191-199` — template `review-item-template` con `review-user`, `review-stars`, `review-comment`.
- `mockups/js/data.js:195-199` — modelo `reviews: [{ user, comment, rating }]` (base; en dashboard se extiende con `status` y `response`).

Nota: la sección "Reseñas" dentro del dashboard no está dibujada en `dashboard-provider.html` — se sigue el mismo estilo de las "Opiniones" de `profile.html`, añadiendo formulario de respuesta y badge "Oculta por moderación". UI a diseñar siguiendo este estilo.

## Alternativas consideradas

### Opcion A — Listado con formulario de respuesta inline por reseña
- Cada reseña sin respuesta muestra un mini-form `<textarea>` + botón "Responder" en línea.
- Pro: bajo número de clicks, UX directa.
- Contra: secciones más largas si hay muchas reseñas.

### Opcion B — Modal de respuesta al hacer click
- Click en "Responder" abre un modal con el contexto de la reseña.
- Pro: foco visual, soporta respuestas largas.
- Contra: navegación adicional, inconsistencia con la simplicidad del resto del dashboard.

## Decision

Se adopta **Opcion A** porque mantiene la coherencia con el patrón visual de `profile.html` (lista simple) y reduce fricción para responder. Las reseñas ya respondidas muestran la respuesta debajo del comentario; las ocultas muestran un badge "Oculta por moderación" con el motivo y permiten responder igualmente (la respuesta sólo se publica cuando la reseña se restaure).

## Riesgos y mitigaciones

- Riesgo: prestador responde con contenido inapropiado. Mitigación: validación de longitud y aplicar las mismas reglas de moderación del REQ-09 a la respuesta.
- Riesgo: confusión sobre reseñas ocultas. Mitigación: badge claro + tooltip con motivo + nota "tu respuesta se mostrará si la reseña se restaura".
- Riesgo: scope leak — ver reseñas de otro prestador. Mitigación: filtro obligatorio por `provider_id = providerActual` en el endpoint.

## Metrica de exito

- `GET /api/v1/providers/me/reviews` devuelve todas las reseñas del prestador, incluidas las `hidden`, en menos de 300 ms p95.
- Responder una reseña genera el registro mediante `POST` (reuso REQ-09) y aparece en la UI sin recarga completa.
- Las reseñas `hidden` muestran el badge "Oculta por moderación" con motivo y no son visibles en el perfil público (verificado contra `/p/:slug`).
