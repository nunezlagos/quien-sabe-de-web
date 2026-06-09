# REQ-23-portfolio-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Galería de hasta 5 fotos del prestador mostrando trabajos previos. El
prestador gestiona la galería desde `dashboard-provider`
(`mockups/dashboard-provider.html:148-187`) y el público la consume en
`profile.html` (sección `#profile-portfolio-container` línea 133 + templates
`portfolio-grid-template` y `portfolio-item-template` líneas 166-176).
Modelo de datos basado en `mockups/js/data.js:33` `portfolio: ["url1", ...]`.

## Criterios de éxito

- [ ] Máximo 5 imágenes por prestador (límite UI línea 155).
- [ ] Upload a R2/MinIO con resize 800x800 server-side.
- [ ] Reorder drag-drop persistido en `sort_order`.
- [ ] Eliminar imagen quita objeto de R2 y la fila de D1.
- [ ] Render público SSR en `profile.html` sustituye datos mock.

## Superficie técnica

### Endpoints API
- `GET    /api/v1/providers/:id/portfolio` — listado público
- `POST   /api/v1/providers/me/portfolio` — upload imagen [sesión prestador]
- `PATCH  /api/v1/providers/me/portfolio/:imageId` — reorder
- `DELETE /api/v1/providers/me/portfolio/:imageId`

### Vistas Astro
- `/p/:slug` (sección Trabajos), `/dashboard-provider` (galería).

### Tablas Drizzle
- `portfolio_images (id, provider_id, r2_key, sort_order, created_at)`
  con UNIQUE `(provider_id, sort_order)`, CHECK count ≤ 5.

### Bindings Cloudflare
- `D1`, `R2` (bucket `media`, prefix `portfolio/`).

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-23.1 | schema-portfolio-images | Tabla + migración + límite 5 | P0 |
| HU-23.2 | upload-foto-portfolio | POST + resize + R2 | P0 |
| HU-23.3 | reorder-eliminar-fotos | PATCH + DELETE | P1 |
| HU-23.4 | render-portfolio-publico-profile | Sustituir mock en profile.html | P0 |
| HU-23.5 | render-portfolio-dashboard-provider | Sustituir mock en dashboard-provider.html | P0 |

## Tests requeridos

- **Unit:** validador MIME, helper resize, generador sort_order.
- **Integración:** intentar subir 6ta foto → 409; eliminar imagen ajena → 403;
  reorder rota sort_order consistentemente.
- **E2E:** prestador sube 3 fotos → reorden → público las ve en `/p/:slug`.

## Dependencias

- **Depende de:** REQ-04
- **Habilita a:** REQ-07

## Riesgos / suposiciones

- R2 sin transformaciones nativas: usar wasm-image-resize.
- Mockup data.js incluye `portfolio` como array de URLs simples; modelo D1
  amplía con sort_order para reorden estable.
