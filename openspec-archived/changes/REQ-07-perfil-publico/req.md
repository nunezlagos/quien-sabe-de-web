# REQ-07-perfil-publico

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE2

## Descripción

Vista pública del prestador (`/p/:slug` o `/profile?id=`). Muestra datos del
perfil (foto, oficio, comuna, descripción), catálogo de servicios visibles,
reseñas con promedio, botones de contacto y acceso a reportar.

## Criterios de éxito

- [ ] Página renderiza en server-side con datos completos (sin spinner inicial).
- [ ] Badge de verificación visible si el prestador está aprobado (REQ-03).
- [ ] Reseñas listadas con paginación.
- [ ] Botones de contacto presentes y trackeables (REQ-08).
- [ ] URL con slug humano cuando es posible; fallback a `?id=`.
- [ ] 404 si el prestador no existe o está inactivo.

## Superficie técnica

### Endpoints API
- `GET /api/v1/providers/:idOrSlug` — perfil público [público]
- `GET /api/v1/providers/:id/reviews` — listado de reseñas [público]

### Vistas Astro
- `/p/:slug`, `/profile` (?id=)

### Tablas Drizzle
- Lectura de `providers`, `services`, `reviews`, `users`

### Bindings Cloudflare
- `D1`, edge cache (TTL 60 s)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-07.1 | endpoint-perfil-publico | Endpoint + SSR fetch | P0 |
| HU-07.2 | layout-perfil-publico | Componente con foto, oficio, comuna, descripción | P0 |
| HU-07.3 | seccion-servicios | Render del catálogo público | P0 |
| HU-07.4 | seccion-resenas | Promedio + paginación | P0 |
| HU-07.5 | slug-humano | Generador + redirect `?id=` → `/p/:slug` | P1 |
| HU-07.6 | metadatos-seo | og:title, og:image, json-ld | P1 |

## Tests requeridos

- **Unit:** generador de slug (deduplicación, normalización), helper de metadatos.
- **Integración:** GET perfil con/sin verificación, paginación reseñas, 404 con id inexistente.
- **E2E:** usuario llega de búsqueda → ve perfil completo → datos correctos.

## Dependencias

- **Depende de:** REQ-04, REQ-05, REQ-09
- **Habilita a:** REQ-08, REQ-10

## Riesgos / suposiciones

- Slug humano puede colisionar: estrategia `oficio-comuna-N` con N auto-incremental.
- Edge cache invalidado por update del perfil (PATCH dispara purge).
