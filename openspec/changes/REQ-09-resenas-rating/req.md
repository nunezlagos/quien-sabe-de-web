# REQ-09-resenas-rating

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1, OE2

## Descripción

Vecinos califican (1-5 estrellas) y comentan al prestador post-contacto.
Una reseña por (vecino, prestador) salvo edición. Promedio público se muestra
en perfil y se usa como filtro en buscador. Moderación admin permite ocultar
reseñas que violan políticas.

## Criterios de éxito

- [ ] Sólo usuarios autenticados que tengan al menos un evento de contacto pueden dejar reseña.
- [ ] Una reseña por par (vecino, prestador). Edición permitida 7 días, luego congela.
- [ ] Promedio calculado con `AVG(rating)` excluyendo ocultas.
- [ ] Admin puede ocultar reseña con motivo (auditoría).
- [ ] Prestador puede responder públicamente una reseña (una respuesta).

## Superficie técnica

### Endpoints API
- `POST   /api/v1/providers/:id/reviews` — crear [sesión vecino]
- `PATCH  /api/v1/reviews/:id` — editar dentro de 7 días [sesión autor]
- `GET    /api/v1/providers/:id/reviews` — listado público [público]
- `POST   /api/v1/reviews/:id/response` — respuesta del prestador [sesión prestador dueño]
- `PATCH  /api/v1/admin/reviews/:id/hide` — ocultar [admin]

### Vistas Astro
- Inline en `/p/:slug`
- `/dashboard-user` (reseñas dejadas)
- `/dashboard-provider` (reseñas recibidas)

### Tablas Drizzle
- `reviews` (id, provider_id, user_id, rating 1-5, body, status, hidden_reason, created_at, edited_until)
- `review_responses` (review_id, body, created_at)

### Bindings Cloudflare
- `D1`

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-09.1 | schema-reviews | Tabla + constraint único (user_id, provider_id) | P0 |
| HU-09.2 | crear-resena | POST con gate por contact_event | P0 |
| HU-09.3 | editar-resena-7-dias | PATCH con ventana temporal | P1 |
| HU-09.4 | respuesta-prestador | POST response (una) | P1 |
| HU-09.5 | promedio-publico | Cálculo y exposición | P0 |
| HU-09.6 | moderacion-admin | Ocultar con motivo | P1 |

## Tests requeridos

- **Unit:** validador Zod (rating 1-5, body opcional con longitud), cálculo promedio.
- **Integración:** crear sin contacto previo → 403; crear duplicada → 409; editar fuera de ventana → 403; admin oculta → no aparece en promedio ni en GET público.
- **E2E:** vecino contacta → vuelve y deja reseña → aparece en perfil con promedio actualizado.

## Dependencias

- **Depende de:** REQ-07, REQ-08
- **Habilita a:** REQ-06 (filtro rating), REQ-12 (reseñas recibidas)

## Riesgos / suposiciones

- Gate "debe haber contactado" reduce fraude pero no lo elimina. Captcha en HU futura si crece.
- Edición congelada a 7 días para evitar manipulación post-respuesta del prestador.
