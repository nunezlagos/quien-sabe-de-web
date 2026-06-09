# REQ-04-perfil-prestador

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

CRUD del perfil de prestador: oficio (taxonomía), comuna, descripción, foto
(R2), datos de contacto (teléfono, email opcional, WhatsApp), tarifa
referencial y disponibilidad. El perfil sólo aparece en búsqueda pública si
el REQ-03 está aprobado.

## Criterios de éxito

- [ ] Prestador puede crear, editar y eliminar su perfil.
- [ ] Foto sube a R2 con resize automático server-side (avatar 256x256).
- [ ] Vista preview en dashboard antes de publicar.
- [ ] Soft-delete: marcar como inactivo no borra datos (auditoría).
- [ ] Cambio de oficio dispara reindex (REQ-06).

## Superficie técnica

### Endpoints API
- `POST   /api/v1/providers/me` — crear perfil [sesión prestador]
- `PATCH  /api/v1/providers/me` — editar [sesión prestador]
- `DELETE /api/v1/providers/me` — soft delete [sesión prestador]
- `POST   /api/v1/providers/me/photo` — subir foto a R2 [sesión prestador]
- `GET    /api/v1/providers/me` — perfil propio [sesión prestador]

### Vistas Astro
- `/dashboard-provider` (sección perfil)

### Tablas Drizzle
- `providers` (id, user_id, trade_id, commune_id, description, photo_r2_key, phone, whatsapp, hourly_rate_clp, status)
- `trades` (taxonomía: gasfiter, electricista, jardinero, ...)

### Bindings Cloudflare
- `D1`, `R2` (bucket `media`)

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-04.1 | schema-providers-trades | Tabla + migración + seed trades | P0 |
| HU-04.2 | crud-perfil-prestador | Endpoints + Zod | P0 |
| HU-04.3 | upload-foto-r2 | Subida + resize + cleanup huérfanos | P0 |
| HU-04.4 | preview-perfil | Vista preview en dashboard | P1 |
| HU-04.5 | reindex-on-update | Trigger reindex búsqueda al cambiar oficio/comuna | P1 |

## Tests requeridos

- **Unit:** validador Zod del perfil, función de generación de slug, sanitización de descripción.
- **Integración:** CRUD completo, intentos de modificar perfil ajeno (403), foto con tipo MIME inválido.
- **E2E:** prestador crea perfil → sube foto → preview → publica → admin verifica → aparece en búsqueda.

## Dependencias

- **Depende de:** REQ-01, REQ-03
- **Habilita a:** REQ-05, REQ-06, REQ-07, REQ-12

## Riesgos / suposiciones

- R2 sin transformaciones nativas: resize server-side con `wasm-image-resize` o equivalente Workers-friendly.
- Taxonomía inicial de oficios cerrada (admin define en REQ-13).
- Soft-delete preserva FK con reseñas históricas.
