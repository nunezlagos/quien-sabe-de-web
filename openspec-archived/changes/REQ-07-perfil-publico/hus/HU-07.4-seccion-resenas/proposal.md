# Propuesta — HU-07.4 — Sección de reseñas con promedio y paginación

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

La sección de reseñas muestra el promedio y el listado paginado de opiniones de un prestador. Es la prueba social que pondera la decisión de contacto. Esta HU introduce el endpoint `GET /api/v1/providers/:id/reviews` con paginación por cursor (no offset, porque la lista es append-only por created_at DESC) y el componente Astro que lo consume. El promedio se calcula una sola vez por request (no por fila), y las reseñas con `status='hidden'` no aparecen ni afectan el promedio. Vinculado a OE2 (perfil completo = más conversión).

## Mockups de referencia

- `mockups/profile.html:151-159` — bloque "Opiniones" con icono `ri-star-line` y contenedor `profile-reviews-container`.
- `mockups/profile.html:191-199` — template de review (avatar+estrellas+comentario).
- `mockups/profile.html:84-89` — header con rating promedio y contador "trabajos realizados".
- `mockups/profile.html:201-203` — empty state ("Sin opiniones todavía").

## Alternativas consideradas

### Opcion A — Endpoint REST con paginación por cursor + componente presentacional
- `GET /api/v1/providers/:id/reviews?limit=10&cursor=<x>` → `{ items: Review[], cursor, ratingAvg, total }`.
- Pro: estable para append-only; no se salta filas si llega una reseña entre requests.
- Pro: el componente Astro no toca la DB.
- Contra: requiere encoding/decoding del cursor.

### Opcion B — Paginación por offset/limit clásico
- `?page=2&limit=10`.
- Pro: más simple de implementar.
- Contra: si se crea una reseña entre requests, el usuario ve duplicados o se salta una. Inaceptable en UX pública.

### Opcion C — Infinite scroll puro sin endpoint (todo en cliente)
- HTML server-side renderiza 10; cliente pide más con fetch.
- Pro: SSR mínimo.
- Contra: dos code paths (SSR + cliente) para el mismo render. Sin valor si la paginación es cursor.

## Decision

Se elige **Opcion A**. La paginación por cursor es la única que garantiza consistencia bajo escrituras concurrentes, y el componente se mantiene simple al consumir un único endpoint. El cursor encodea `(created_at, id)` en base64 url-safe (mismo formato que otras HUs del proyecto).

## Riesgos y mitigaciones

- Riesgo: reseñas ocultas rompen el promedio → Mitigación: la query usa `WHERE status='visible'` tanto en items como en `AVG(rating)`.
- Riesgo: cursor malformado → Mitigación: validar con Zod; 400 si no parsea.
- Riesgo: miles de reseñas hacen la query lenta → Mitigación: índice `idx_reviews_provider_visible_created (provider_id, status, created_at DESC, id DESC)` en HU-09.1.
- Riesgo: el promedio cambia entre páginas (un visitante ve "4.5" en página 1 y "4.6" en página 2) → Mitigación: el `ratingAvg` se devuelve una sola vez en la primera página; las siguientes páginas devuelven `ratingAvg` estable.

## Metrica de exito

- GET con 15 reseñas y `?limit=10` → 10 items + `cursor` + `ratingAvg` correcto + `total: 15`.
- Segunda llamada con `cursor` → siguientes 5 sin duplicados (verificar intersección vacía).
- Reseña `status='hidden'` → no aparece ni en `items` ni en el cálculo del promedio.
- Prestador sin reseñas → `{ items: [], cursor: null, ratingAvg: null, total: 0 }`.
- `cursor` inválido → 400.
