# Diseño técnico — HU-27.2 — Endpoint activar rol prestador

**REQ padre:** REQ-27-multi-rol-cuenta

## Modelo de datos

Reutiliza `user_roles` (HU-27.1). Esta HU no introduce tablas.

## Contrato de API

| Endpoint | Método | Auth | Response 200 | Errores |
|---|---|---|---|---|
| `/api/v1/users/me/roles/:role` | POST | sesión + email verificado | `{ roles: Role[], active_role: Role }` | 401 (sin sesión), 403 (email no verificado o rol no auto-asignable), 404 (rol no existe en enum) |

Whitelist de roles auto-asignables: `['vecino', 'prestador']`. Intentar `admin` devuelve 403.

## Validaciones Zod

```ts
// src/lib/validators/auth/roles.ts (extensión HU-27.1)
const AUTO_ASSIGNABLE_ROLES = ['vecino', 'prestador'] as const
export const autoAssignableRoleSchema = z.enum(AUTO_ASSIGNABLE_ROLES)
```

## Componentes UI

### Endpoint
- `src/pages/api/v1/users/me/roles/[role].ts` con handler POST:
  - `requireSession` → 401.
  - `requireVerifiedEmail` → 403.
  - `autoAssignableRoleSchema.safeParse(params.role)` → 404 si rol no existe en enum, 403 si no está en whitelist.
  - `addRole(env, session.userId, role, grantedBy=null)` (dual-write incluido).
  - `updateSessionRoles(env, session.id, await getUserRoles(env, session.userId))` — actualiza payload KV.
  - Responde 200 con `{roles, active_role}`.

### Servicio `updateSessionRoles`
- `src/lib/services/sessions/update.ts`:
  - `updateSessionRoles(env, sessionId, roles: Role[])` — `env.SESSION.put('session:' + sessionId, JSON.stringify({..., roles}), { expirationTtl: 86400 * 30 })`.

### Integración en `mockups/dashboard-user.html:62-64`
- El botón "Crear Perfil PRO" cambia a `<form action="/api/v1/users/me/roles/prestador" method="POST">` con hidden CSRF token.
- En SPA: `fetch POST` y `window.location.assign('/create-trade')` en 200.

## Flujo de interacción (secuencial)

1. Vecino autenticado hace click en "Crear Perfil PRO".
2. Cliente envía `POST /api/v1/users/me/roles/prestador` (con CSRF si aplica).
3. `requireSession` valida.
4. `requireVerifiedEmail` valida (REQ-20).
5. Whitelist check: 'prestador' ∈ AUTO_ASSIGNABLE → OK.
6. `addRole` ejecuta `db.batch([INSERT OR IGNORE INTO user_roles, UPDATE users SET role = ?])` (dual-write HU-27.1).
7. `updateSessionRoles` actualiza el payload KV con el nuevo array.
8. Responde 200 con `{roles: ['vecino', 'prestador'], active_role: 'vecino'}`.
9. Cliente redirige a `/create-trade` (REQ-21).

## Capa de servicios

- `src/lib/services/auth/roles.ts`:
  - `addRole(env, userId, role, grantedBy?)` — INSERT OR IGNORE + UPDATE users.role (dual-write).
- `src/lib/services/sessions/update.ts`:
  - `updateSessionRoles(env, sessionId, roles)` — KV put.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/auth-roles.test.ts` (extensión) — `autoAssignableRoleSchema` acepta 'vecino', 'prestador'; rechaza 'admin', 'superhero'. |
| Integración | `tests/integration/auth/activate-role.test.ts` — fixture user vecino verificado: POST `/users/me/roles/prestador` → 200 + nueva fila en `user_roles` + `users.role` actualizado; segunda POST con mismo rol → 200 (idempotente); POST con user sin verify → 403; POST `/users/me/roles/admin` → 403; sesión KV actualizada con nuevo set. |
| E2E | `tests/e2e/activate-role-flow.spec.ts` — login vecino verificado → /dashboard-user → click "Crear Perfil PRO" → POST → redirige a /create-trade; navbar ahora muestra dropdown con "Vecino" / "Prestador" (HU-27.3). |

## Dependencias y secuencia

- **Bloqueado por:** HU-27.1 (schema `user_roles`), REQ-01 (sesión), REQ-20 (email verificado), HU-21.1 (destino `/create-trade`).
- **Bloquea a:** HU-27.3 (selector dropdown muestra los roles que HU-27.2 activó), HU-27.4 (middleware evalúa los roles).
- **Recursos compartidos:** `src/lib/services/auth/`, `src/lib/services/sessions/`.

## Riesgos técnicos

- Riesgo: el CSRF token no se valida → Mitigación: REQ-01 ya debe tener middleware CSRF; verificar que aplica a este endpoint.
- Riesgo: la sesión KV no se actualiza → Mitigación: `updateSessionRoles` es parte del flujo crítico; test lo verifica explícitamente.
- Riesgo: si el user ya tenía rol 'admin' (auto-otorgado fuera de esta HU), el whitelist lo rechaza al intentar 'vecino' → Mitigación: el whitelist sólo filtra el `:role` que se intenta AGREGAR; un admin puede seguir intentando agregar 'vecino' (que ya debería tener). No es bug.