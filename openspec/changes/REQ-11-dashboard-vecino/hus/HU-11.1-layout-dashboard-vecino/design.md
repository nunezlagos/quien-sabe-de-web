# Diseno tecnico — HU-11.1 — Layout del dashboard del vecino

**REQ padre:** REQ-11-dashboard-vecino

## Modelo de datos

No aplica. Esta HU no introduce tablas nuevas. Consume `users` (REQ-02) para resolver el usuario en sesión y su `commune_id`. Los endpoints de las tabs (HU-11.2, HU-11.3, HU-11.4) son los que leen/escriben tablas.

## Contrato de API

Esta HU no expone endpoints nuevos. La superficie que orquesta:

- `GET /dashboard-user?tab=contacts|reviews|profile` — vista Astro SSR.
- Reusa sesión vía `Astro.locals.user` (REQ-01).
- El middleware (`src/middleware.ts`) hace el redirect post-login y bloquea no-vecinos.

Validación interna (no API expuesta):

```ts
// src/lib/validators/dashboard.ts (firmas)
export const dashboardTabSchema = z.enum(['contacts', 'reviews', 'profile'])
export type DashboardTab = z.infer<typeof dashboardTabSchema>

export const postLoginRedirectSchema = z.object({
  next: z.string().regex(/^\/dashboard-user(\?.*)?$/).optional(),
})
```

## Validaciones Zod

```ts
// src/lib/validators/dashboard.ts
import { z } from 'zod'

export const dashboardTabSchema = z.enum(['contacts', 'reviews', 'profile'])
```

Si `?tab=` no es uno de los tres valores, se cae a `contacts` (no se devuelve error — sólo se redirige al default). Esto evita superficie 4xx para una decisión puramente de UI.

## Componentes UI

- `src/pages/dashboard-user.astro` — punto de entrada SSR. Lee `Astro.locals.user`, lee `?tab=`, monta `<UserLayout tab={...} user={...}>`.
- `src/components/dashboard/user/Layout.astro` — shell con header (avatar, email, botón "Cerrar sesión") y tres tabs. Slots nombrados para contenido (`contacts`, `reviews`, `profile`).
- `src/components/dashboard/user/Header.astro` — subcomponente del layout con foto + email + rol.
- `src/components/dashboard/user/Tabs.astro` — links a `?tab=contacts|reviews|profile` con clase activa según prop.
- `src/lib/middleware/postLoginRedirect.ts` — helper que dada una sesión y un `next` arbitrario, decide el destino del redirect post-login.

Estilo visual: replica `mockups/dashboard-user.html:29-39` (tarjeta blanca rounded-[2.5rem] con sombra suave) pero reordenada para que la foto y el email vivan dentro del header y las tabs queden debajo, en una fila horizontal.

## Flujo de interaccion (secuencial)

1. Vecino completa login → callback de OAuth redirige a `/auth/callback?next=...`.
2. `src/middleware.ts` evalúa: si sesión válida + rol `vecino` + `next` permitido → 302 a `/dashboard-user` (o `/dashboard-user?tab=profile` si `next` lo pidió).
3. Vecino GET `/dashboard-user?tab=reviews` → middleware verifica sesión → `dashboard-user.astro` renderiza layout con tab `reviews` activa.
4. Vecino sin sesión → middleware responde 302 a `/login?next=/dashboard-user?tab=reviews`.
5. Click en tab "Mis reseñas" → GET a la misma ruta con `?tab=reviews` (full reload, no SPA).

## Capa de servicios

- `src/lib/services/dashboard/resolveDefaultTab.ts` — dada sesión y `?tab=`, devuelve tab efectiva (default `contacts`).
- `src/lib/middleware/postLoginRedirect.ts` — exporta `resolvePostLoginRedirect(session, requestedNext): string`.

Sin nuevos servicios de dominio; HU-11.2/11.3/11.4 son las que leen datos.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/dashboard/postLoginRedirect.test.ts` | Distintos roles y `next` arbitrarios |
| Unit | `tests/unit/dashboard/resolveDefaultTab.test.ts` | Default y fallback a `contacts` |
| Integracion | `tests/integration/middleware/dashboard-guard.test.ts` | Sin sesión → 302; vecino → 200; admin → redirect a `/dashboard-admin` |
| E2E | `tests/e2e/dashboard-user-layout.spec.ts` | Login redirige, tabs visibles, click navega |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesiones), REQ-02 (rol `vecino` definido).
- **Bloquea a:** HU-11.2, HU-11.3, HU-11.4 (montan contenido en slots del layout).
- **Recursos compartidos:** `src/middleware.ts`, `src/lib/middleware/`, layouts Astro en `src/layouts/`.

## Riesgos tecnicos

- Riesgo: middleware ejecuta en cada request y agrega latencia perceptible → Mitigación: la lectura de sesión desde KV ya está cacheada en el mismo request; el guard admin/vecino es una comparación de string.
- Riesgo: cambio de firma en `Astro.locals.user` rompe esta HU silenciosamente → Mitigación: tipar `App.Locals` en `src/env.d.ts` con el helper `defineMiddleware` que valide el shape.
- Riesgo: tabs con `?tab=` se cachean en CDN como respuestas distintas → Mitigación: configurar `Cache-Control: private, no-store` para `/dashboard-user` (es contenido autenticado).
