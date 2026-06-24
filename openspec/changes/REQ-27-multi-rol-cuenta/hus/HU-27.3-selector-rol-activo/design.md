# Diseño técnico — HU-27.3 — Selector de rol activo en navbar

**REQ padre:** REQ-27-multi-rol-cuenta

## Modelo de datos

No introduce tablas. Lee `user_roles` (HU-27.1) y actualiza sesión KV.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/users/me/active-role` | POST | sesión | `{ role: Role }` | `{ active_role: Role, redirect: string }` | 401 (sin sesión), 403 (user no tiene ese rol), 400 (rol inválido) |

`redirect`:
- `'vecino'` → `/dashboard-user`
- `'prestador'` → `/dashboard-provider`
- `'admin'` → `/dashboard-admin`

## Validaciones Zod

```ts
// src/lib/validators/auth/active-role.ts
export const activeRoleSchema = z.object({
  role: z.enum(['vecino', 'prestador', 'admin']),
})
```

## Componentes UI

### Componente Astro
- `src/components/navbar/RoleSwitcher.astro` con prop `{ roles: Role[], activeRole: Role }`.
- Render condicional: si `roles.length <= 1` retorna `null` (no muestra nada).
- Markup:
  ```astro
  <div class="relative" id="role-switcher">
    <button id="role-switcher-btn" class="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-sm font-bold text-gray-700 transition">
      <i class="ri-user-settings-line"></i>
      <span>{activeRoleLabel}</span>
      <i class="ri-arrow-down-s-line"></i>
    </button>
    <div id="role-switcher-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 z-50">
      {roles.map(r => (
        <button data-role={r} class="role-option block w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
          {roleLabels[r]}
        </button>
      ))}
    </div>
  </div>
  ```

### Endpoint
- `src/pages/api/v1/users/me/active-role.ts` (POST):
  - `requireSession` → 401.
  - Parse body con `activeRoleSchema` → 400.
  - `if (!await hasRole(env, session.userId, role))` → 403.
  - Calcular `redirect = ROLE_REDIRECTS[role]`.
  - Set cookie: `qs_active_role=<role>.<hmac>` con `signCookie(role, env.CONSENT_SECRET)`.
  - Update sesión KV con `active_role`.
  - Responde 200 con `{active_role, redirect}`.

### Integración en `src/layouts/Layout.astro`
- Insertar `<RoleSwitcher roles={session.roles} activeRole={session.active_role || session.roles[0]} />` en el navbar, antes del slot de acciones del usuario.

### Script inline del componente
- Toggle dropdown visibility on `role-switcher-btn` click.
- Cada `role-option` button hace `fetch POST /api/v1/users/me/active-role` con `{role: data-role}` y `window.location.assign(data.redirect)`.
- CSRF token si aplica (mismo helper que HU-27.2).

## Flujo de interacción (secuencial)

### SSR del navbar
1. Astro.locals.session tiene `userId`, `roles`, `active_role`.
2. `<RoleSwitcher>` recibe props; renderiza dropdown si `roles.length > 1`.
3. HTML llega al cliente con el componente visible.

### Cambio de rol
1. User hace click en "Prestador".
2. JS envía `POST /api/v1/users/me/active-role` con `{role: 'prestador'}`.
3. Backend valida, setea cookie, actualiza sesión.
4. Responde 200 con `{redirect: '/dashboard-provider'}`.
5. Cliente hace `window.location.assign('/dashboard-provider')`.
6. SSR del nuevo dashboard lee cookie + sesión → renderiza `/dashboard-provider`.

### Cambio de rol vía deep link
1. User navega directo a `/dashboard-provider`.
2. SSR lee sesión; el middleware acepta porque user tiene rol 'prestador' en su set (HU-27.4).
3. Renderiza el dashboard.

## Capa de servicios

- `src/lib/services/sessions/active-role.ts`:
  - `setActiveRole(env, sessionId, role)` — actualiza sesión KV con `active_role: role`.

Reuso de `signCookie`/`verifyCookie` de HU-22.1.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/active-role.test.ts` — schema acepta los 3 roles; rechaza string vacío, número, null. |
| Integración | `tests/integration/auth/role-switcher.test.ts` — user con `roles=['vecino','prestador']` GET página con navbar → HTML contiene `<div id="role-switcher">` con 2 opciones; user con `roles=['vecino']` → HTML NO contiene el switcher. POST `/users/me/active-role {role:'prestador'}` → 200 + cookie `qs_active_role` firmada + sesión KV con `active_role='prestador'`; POST con rol no presente en set del user → 403; POST con rol inválido → 400. |
| E2E | `tests/e2e/role-switcher.spec.ts` (Playwright) — login user multi-rol → ver dropdown → click "Prestador" → URL final = `/dashboard-provider`; cookie `qs_active_role` presente con firma válida; alterar cookie manualmente → reload → cae a fallback del primer rol. |

## Dependencias y secuencia

- **Bloqueado por:** HU-27.1 (tabla `user_roles`), HU-27.2 (roles auto-activables), HU-22.1 (helper `signed-cookie`).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `src/lib/utils/signed-cookie.ts`, `src/lib/services/sessions/`, `src/layouts/Layout.astro`.

## Riesgos técnicos

- Riesgo: `signCookie` usa `env.CONSENT_SECRET` que es de HU-22.1 → Mitigación: si `env.CONSENT_SECRET` no está configurado (entorno dev), fallback a `'dev-secret-only-for-tests'`. Documentar.
- Riesgo: el dropdown se renderiza pero el JS no carga (CSP estricto) → Mitigación: usar el mismo approach que HU-22.1 (script inline al final del body).
- Riesgo: la cookie `qs_active_role` choca con el esquema de cookies de sesión (`qs_session`) → Mitigación: prefijo `qs_active_role_` (con guión bajo) para distinguir. O usar `qs_active_role`. Documentar.