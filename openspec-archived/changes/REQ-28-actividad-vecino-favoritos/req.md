# REQ-28-actividad-vecino-favoritos

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE2

## Descripción

El vecino guarda prestadores en favoritos y la plataforma registra sus
últimos vistos. Estas dos colecciones alimentan las secciones "Vecinos
Guardados" (`mockups/dashboard-user.html:71-97`) y "Recientes / Last
Viewed" (`mockups/dashboard-user.html:100-112`).

## Criterios de éxito

- [ ] Toggle de favorito con corazón en cards de `index.html` y en header
      de `profile.html`.
- [ ] Vista pública de prestador registra `user_views` (sin duplicar
      < 1h por par).
- [ ] Sección "Vecinos Guardados" en dashboard renderiza desde API con
      botón WhatsApp directo (línea 83-94 del mockup) en estilo idéntico.
- [ ] Sección "Recientes" renderiza últimas 5 vistas con icono según
      tipo (línea 100-112).
- [ ] Vecino puede quitar favorito desde dashboard.

## Superficie técnica

### Endpoints API
- `POST   /api/v1/users/me/favorites/:provider_id`
- `DELETE /api/v1/users/me/favorites/:provider_id`
- `GET    /api/v1/users/me/favorites`
- `GET    /api/v1/users/me/views?limit=5`
- `POST   /api/v1/providers/:id/views` (interno, llamado en SSR de perfil)

### Vistas Astro
- `/dashboard-user` (secciones favoritos + viewed).
- `/p/:slug` (botón corazón en header).
- `/` (botón corazón en cards).

### Tablas Drizzle
- `user_favorites(user_id, provider_id, created_at)` PK compuesta.
- `user_views(user_id, provider_id, viewed_at)` con índice
  `(user_id, viewed_at DESC)`.

### Bindings Cloudflare
- `D1`, `SESSION` (KV — anti-duplicado de view < 1h por sesión).

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-28.1 | schema-favoritos | Tablas + migraciones | P0 |
| HU-28.2 | toggle-favorito-en-cards | Corazón en index + profile | P0 |
| HU-28.3 | vista-favoritos-dashboard | Render sección "Vecinos Guardados" | P0 |
| HU-28.4 | schema-viewed-history-y-render | `user_views` + sección Recientes | P1 |

## Tests requeridos

- **Unit:** dedupe `recordView` < 1h, sort de favoritos por recientes.
- **Integración:** toggle idempotente; favoritos respeta soft-delete del
  prestador (no aparece si deleted).
- **E2E:** vecino marca favorito en `/` → aparece en dashboard con botón
  WhatsApp.

## Dependencias

- **Depende de:** REQ-02, REQ-04, REQ-07
- **Habilita a:** REQ-11

## Riesgos / suposiciones

- `user_views` puede crecer rápido; aplicar TRIM con cron mensual a últimas
  50 por usuario.
- Mockup muestra inicial del nombre en avatar (línea 77 "J"); fallback si
  el prestador no tiene foto en R2.
