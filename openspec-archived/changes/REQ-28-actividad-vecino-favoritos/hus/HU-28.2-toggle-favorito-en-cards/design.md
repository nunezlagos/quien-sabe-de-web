# Diseño técnico — HU-28.2 — Botón corazón en cards de index y profile

**REQ padre:** REQ-28-actividad-vecino-favoritos

## Modelo de datos

No modifica schema. Consume `userFavorites` definida en HU-28.1.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/users/me/favorites/:provider_id` | POST | sesión vecino | (vacío) | `{ favorited: true }` | 401 sin sesión, 404 provider inexistente, 410 provider soft-deleted |
| `/api/v1/users/me/favorites/:provider_id` | DELETE | sesión vecino | (vacío) | `{ favorited: false }` | 401 sin sesión, 404 provider inexistente |

Idempotencia:

- POST repetido sobre par existente → 200 `{ favorited: true }` sin nueva fila.
- DELETE sobre par inexistente → 200 `{ favorited: false }` sin error.

## Validaciones Zod

```ts
// src/lib/validators/favorites.ts (pseudocódigo)
export const providerIdParamSchema = z.object({
  provider_id: z.string().uuid(),
})
// El body es vacío en ambos métodos; se valida solo el param de ruta.
```

## Componentes UI

### Páginas Astro

- `src/pages/index.astro` — listado público. Cada card recibe
  `<FavoriteButton providerId initialActive />`. Mockup base:
  `mockups/index.html:317-375` (`grid-card-template`) y
  `mockups/index.html:377` en adelante (`list-card-template`).
- `src/pages/p/[slug].astro` — perfil público. Inserta `<FavoriteButton />`
  en el header junto a "Contactar". Mockup base:
  `mockups/profile.html:60-104` (zona de acciones, línea 92-103). UI a
  diseñar siguiendo este estilo: botón circular junto al bloque
  `profile-whatsapp-btn` (línea 93).

### Componentes Astro reutilizables

- `src/components/favorites/FavoriteButton.astro` — props:
  - `providerId: string`
  - `initialActive: boolean`
  - `size?: 'sm' | 'md'` (sm = `w-8 h-8`, md = `w-10 h-10`).
- Mockup base:
  - Estilo activo/inactivo: `mockups/dashboard-user.html:72` (icono
    `ri-heart-line` / `ri-heart-fill`, color `text-red-500`).
  - Estilo del botón circular: `mockups/dashboard-user.html:83`
    (`w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-500
    hover:text-white transition`), reusando el patrón con
    `bg-red-100 text-red-600 hover:bg-red-500 hover:text-white`.
- Islas requeridas: sí, `client:load` con un módulo mínimo que ataca el
  endpoint y aplica optimistic update.

## Flujo de interacción (secuencial)

1. Usuario logueado entra a `/` y la card se renderiza con
   `initialActive` calculado en SSR consultando `isFavorite()`.
2. Usuario clica el corazón en la card (mockup
   `mockups/index.html:317-375`, header del card).
3. Cliente bloquea el botón, alterna icono y dispara
   `POST /api/v1/users/me/favorites/:provider_id` (o DELETE si estaba
   activo).
4. Servidor valida sesión, valida `provider_id`, hace insert/delete
   idempotente y responde `{ favorited: boolean }`.
5. Cliente desbloquea el botón. Si la respuesta es 401, abre el modal
   de login (REQ-01) y revierte el icono. Si 4xx/5xx genéricos, revierte
   y muestra toast.

## Capa de servicios

- `src/lib/services/activity/favorites.ts` (ya creada en HU-28.1):
  - `addFavorite(db, userId, providerId): Promise<void>`
  - `removeFavorite(db, userId, providerId): Promise<void>`
  - `isFavorite(db, userId, providerId): Promise<boolean>`
- `src/lib/client/favorites.ts` (nuevo, cliente):
  - `toggleFavorite(providerId: string, current: boolean): Promise<{ favorited: boolean }>`
    — selecciona método POST/DELETE según `current`, lanza error si la
    respuesta no es 2xx.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/favorites/toggle-client.test.ts` | Selección de método según estado, manejo de errores |
| Integración | `tests/integration/favorites/toggle.test.ts` | POST/DELETE contra D1, idempotencia, 401 sin sesión, 404 provider inexistente |
| E2E | `tests/e2e/favorite-toggle.spec.ts` | Vecino logueado en `/` clica corazón, recarga, sigue activo |

## Dependencias y secuencia

- **Bloqueado por:** HU-28.1 (schema y helpers), REQ-01 (sesión vecino),
  REQ-04 (providers).
- **Bloquea a:** HU-28.3 (no hay nada para listar sin toggle).
- **Recursos compartidos:** `src/lib/services/activity/favorites.ts`,
  `src/pages/index.astro`, `src/pages/p/[slug].astro`,
  `src/middleware.ts` (verificación de sesión en endpoints `/api/v1/users/me/*`).

## Riesgos técnicos

- Riesgo: el botón no encaja en `grid-card-template` y rompe el layout
  → Mitigación: posición `absolute top-3 right-3` dentro del header de
  la card (línea 320-342 del mockup) sin alterar el flex padre.
- Riesgo: race condition entre múltiples clics rápidos → Mitigación:
  estado `pending` en el componente que ignora clics adicionales hasta
  que termine la request.
- Riesgo: SSR debe consultar `isFavorite` para cada card (N+1) →
  Mitigación: el endpoint que renderiza `/` ya tendrá la lista de
  providers; agregar un único batch query `SELECT provider_id FROM
  user_favorites WHERE user_id = ? AND provider_id IN (?, ?, ...)` antes
  de renderizar.
