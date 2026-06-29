# Diseño técnico — HU-28.3 — Sección Vecinos Guardados en dashboard-user

**REQ padre:** REQ-28-actividad-vecino-favoritos

## Modelo de datos

No modifica schema. Consume `userFavorites` (HU-28.1) y `providers`
(REQ-04) vía join.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/users/me/favorites` | GET | sesión vecino | (vacío) | `{ favorites: FavoriteItem[] }` | 401 sin sesión |

Forma de `FavoriteItem`:

| Campo | Tipo | Origen |
|---|---|---|
| `provider_id` | string (uuid) | `user_favorites.provider_id` |
| `slug` | string | `providers.slug` |
| `name` | string | `providers.display_name` |
| `initial` | string (1 char) | derivado de `name` |
| `avatar_url` | string \| null | `providers.avatar_url` (R2) |
| `trade` | string | `providers.primary_trade` |
| `trade_badge_class` | string | mapping de oficio → clases Tailwind (`bg-blue-100 text-blue-700`, etc.) |
| `phone_wa` | string \| null | `providers.whatsapp_e164` |
| `favorited_at` | string (ISO) | `user_favorites.created_at` |

## Validaciones Zod

```ts
// src/lib/validators/favorites.ts (pseudocódigo)
export const listFavoritesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/dashboard-user.astro` — sección "Vecinos Guardados"
  reemplaza items hardcoded por `<FavoritesList items={favorites} />`.
  Mockup base: `mockups/dashboard-user.html:68-97` (contenedor padre
  línea 68, sección línea 71-97).

### Componentes Astro reutilizables

- `src/components/activity/FavoritesList.astro` — props:
  - `items: FavoriteItem[]`
- Mockup base: `mockups/dashboard-user.html:71-97`. Conserva el contenedor
  `bg-white rounded-3xl shadow-sm border border-gray-100 p-6`, el header
  con `ri-heart-line text-red-500`, y la grilla `space-y-3`.
- Islas requeridas: parcial. La acción "Quitar" usa un módulo cliente
  que llama a `DELETE /api/v1/users/me/favorites/:provider_id` (definido
  en HU-28.2) y elimina el `<li>` del DOM.

- `src/components/activity/FavoriteRow.astro` — props:
  - `item: FavoriteItem`
- Mockup base: `mockups/dashboard-user.html:75-84` (un item). Conserva
  estructura `flex items-center justify-between p-3 bg-gray-50
  rounded-2xl border border-gray-100`, avatar línea 77 (con fallback a
  inicial), nombre línea 79, badge oficio línea 80, botón WhatsApp
  línea 83.

- `src/components/activity/FavoritesEmpty.astro` — estado vacío. UI a
  diseñar siguiendo el estilo del card padre
  (`mockups/dashboard-user.html:71`): contenido centrado con texto "Aún
  no has guardado vecinos" y CTA `<a href="/">Buscar</a>` reusando el
  estilo de botón de `mockups/dashboard-user.html:62` (Crear Perfil PRO).

## Flujo de interacción (secuencial)

1. Vecino navega a `/dashboard-user`. El page Astro corre en SSR.
2. Server llama a `listFavorites(db, userId)` y prepara el array de
   `FavoriteItem` con el mapping de oficio → clases de badge.
3. `<FavoritesList />` renderiza el HTML del mockup
   `mockups/dashboard-user.html:71-97` con datos reales.
4. Vecino clica el botón WhatsApp verde de un item (`mockups/dashboard-user.html:83`).
5. Cliente abre `wa.me/<phone>` en nueva pestaña y dispara tracking
   REQ-08 (evento `contact_whatsapp_from_favorites`).
6. Vecino clica avatar → menú "Quitar". Isla cliente llama
   `DELETE /api/v1/users/me/favorites/:provider_id` y, ante 200,
   elimina el `<li>` del DOM. Si la lista queda vacía, renderiza
   `<FavoritesEmpty />` in-place.

## Capa de servicios

- `src/lib/services/activity/favorites.ts` (HU-28.1) ya expone
  `listFavorites(db, userId, limit?)`. Esta HU añade:
  - `mapTradeToBadgeClass(trade: string): string` — pure function que
    devuelve la clase Tailwind del badge (`bg-blue-100 text-blue-700`
    para Gasfiter, `bg-yellow-100 text-yellow-700` para Electricista,
    etc., con fallback `bg-gray-100 text-gray-700`).
- `src/lib/services/activity/favorites-view.ts` (nuevo):
  - `buildFavoriteItem(row): FavoriteItem` — compone el item listo para
    el componente.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/favorites/map-trade-badge.test.ts` | Mapping oficio → clase Tailwind con fallback |
| Unit | `tests/unit/favorites/build-favorite-item.test.ts` | Avatar con/sin foto, derivación de inicial |
| Integración | `tests/integration/favorites/get-list.test.ts` | `GET` endpoint: orden, exclusión soft-deleted, 401 |
| E2E | `tests/e2e/favorites-dashboard.spec.ts` | Vecino marca en `/`, va a `/dashboard-user`, ve el card, hace clic WhatsApp |

## Dependencias y secuencia

- **Bloqueado por:** HU-28.1 (schema/helpers), HU-28.2 (endpoints
  POST/DELETE), REQ-08 (tracking WhatsApp).
- **Bloquea a:** ninguna en este REQ; habilita REQ-11.
- **Recursos compartidos:** `src/pages/dashboard-user.astro`,
  `src/lib/services/activity/favorites.ts`.

## Riesgos técnicos

- Riesgo: mapping de oficio a colores se desincroniza si se agregan
  oficios → Mitigación: tabla `trades` (REQ-04) ya debería exponer un
  campo `badge_class` o `color`; si no existe aún, mantener mapping en
  servicio y abrir issue de seguimiento.
- Riesgo: avatar R2 con CORS roto → Mitigación: usar el binding
  `BUCKET` para servir vía URL firmada o vía `/files/avatar/:id` proxy
  ya existente.
- Riesgo: ítems muy largos rompen el flex → Mitigación: `truncate` en
  el nombre con `class="truncate max-w-[12rem]"` y `title={name}`.
