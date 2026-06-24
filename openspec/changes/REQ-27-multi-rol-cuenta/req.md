# REQ-27-multi-rol-cuenta

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Un usuario puede tener simultáneamente los roles `vecino`, `prestador` y/o
`admin`. El navbar expone un selector de "rol activo" cuando aplica y los
middlewares aceptan cualquiera de los roles del usuario. Refleja el flujo
visible en `mockups/dashboard-user.html:62` donde el vecino puede activar
el rol prestador mediante "Crear Perfil PRO".

## Criterios de éxito

- [ ] Tabla `user_roles(user_id, role)` con UNIQUE `(user_id, role)`.
- [ ] Migración desde `users.role` (string) preserva rol existente.
- [ ] Endpoint para activar nuevo rol disponible sólo a usuarios elegibles.
- [ ] Selector de rol en navbar cuando user tiene > 1 rol.
- [ ] Middleware `requireRole('prestador')` acepta si user tiene ese rol
      entre varios.

## Superficie técnica

### Endpoints API
- `POST   /api/v1/users/me/roles/:role` — activa rol (whitelist: solo `prestador` auto-asignable) [sesión]
- `DELETE /api/v1/users/me/roles/:role` — desactiva (no `admin`) [sesión]
- `GET    /api/v1/users/me` — devuelve `roles: ["vecino","prestador"]` y
  `active_role`

> **Nota**: El endpoint es paramétrico (`/:role`) con whitelist de roles auto-asignables.
> `admin` NO es auto-asignable; solo puede ser asignado por otro admin.

### Vistas Astro
- Navbar con selector (cambio actualiza cookie `active_role`).

### Tablas Drizzle
- `user_roles(user_id, role, granted_at, granted_by?)`.
- Migración eliminar columna `users.role` tras backfill.

### Bindings Cloudflare
- `D1`, `SESSION` (KV — el rol activo va al payload de sesión).

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-27.1 | schema-roles-multiples | Tabla + migración data | P0 |
| HU-27.2 | endpoint-activar-rol-prestador | POST activa rol | P0 |
| HU-27.3 | selector-rol-activo | UI navbar | P1 |
| HU-27.4 | middleware-multi-rol | requireRole acepta lista | P0 |

## Tests requeridos

- **Unit:** helper `hasRole(user, role)`.
- **Integración:** activar rol crea fila; middleware con multi-rol; selector
  cambia cookie y rerouting de dashboard.
- **E2E:** vecino → "Crear Perfil PRO" → ya tiene ambos roles → selector
  visible.

## Dependencias

- **Depende de:** REQ-01, REQ-21
- **Habilita a:** REQ-11, REQ-12

## Riesgos / suposiciones

- Migración no destructiva: mantener `users.role` deprecated durante 1
  release con dual-write.
