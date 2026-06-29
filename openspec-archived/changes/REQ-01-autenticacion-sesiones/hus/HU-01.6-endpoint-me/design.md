# Diseno tecnico — HU-01.6 — GET /auth/me para hidratar el cliente

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

Sin cambios. Sólo lee `locals.user` (poblado por middleware de HU-01.2) y `users.status`.

## Contrato de API

### `GET /api/v1/auth/me` [sesión]

Response 200:
```json
{ "id": 42, "email": "ana@ejemplo.cl", "role": "vecino", "status": "active" }
```

Response 401 (sin sesión):
```json
{ "error": "no autenticado" }
```

Response 403 (baneado):
```json
{ "error": "cuenta deshabilitada" }
```
Headers de respuesta cuando 403: `Set-Cookie: session=; ... Max-Age=0` (cookie limpiada).

## Validaciones Zod

No aplica (sólo lee estado, no acepta body).

## Componentes UI

No aplica directamente. Consumido por:
- Frontend global (futuro) que muestra "Hola, Ana" en headers.
- Hooks de Astro pages que necesitan saber si redirigir o no.

## Flujo de interaccion (secuencial)

1. Middleware global (HU-01.2) ejecuta antes del handler → `locals.user` poblado o `undefined`.
2. Si `locals.user === undefined` → return 401.
3. Si `locals.user.status === 'banned'`:
   - Lee cookie, llama `destroySession(env, token)`.
   - `clearSessionCookie(cookies)`.
   - Return 403.
4. Return 200 con `{ id, email, role, status }` (exactamente esos 4 campos).

## Capa de servicios

Reusa:
- `destroySession(env, token)` (HU-01.2).
- `clearSessionCookie(cookies)` (HU-01.1).

Nuevo endpoint: `src/pages/api/v1/auth/me.ts`.

```ts
// src/pages/api/v1/auth/me.ts (pseudocodigo)
export const GET: APIRoute = async ({ cookies, locals }) => {
  const user = locals.user
  if (!user) return json({ error: 'no autenticado' }, { status: 401 })

  if (user.status === 'banned') {
    const token = cookies.get('session')?.value
    if (token) {
      try { await destroySession(locals.runtime.env.SESSION, token) } catch {}
      clearSessionCookie(cookies)
    }
    return json({ error: 'cuenta deshabilitada' }, { status: 403 })
  }

  return json({ id: user.id, email: user.email, role: user.role, status: user.status }, { status: 200 })
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/auth/me.test.ts` | 200 con sesión válida y DTO exacto (sin `passwordHash`); 401 sin sesión; 403 + cookie Max-Age=0 + key KV borrada cuando `users.status='banned'` |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users`), HU-01.2 (middleware + `locals.user`).
- **Bloquea a:** REQ-02 (frontend llama `/me` para decidir redirect), REQ-11/12/13 (dashboards).
- **Recursos compartidos:** `App.Locals.user`, `destroySession`, `clearSessionCookie`.

## Riesgos tecnicos

- Riesgo: el DTO cambia accidentalmente al refactorizar `User` type → Mitigación: test verifica con `expect(body).toEqual({ id, email, role, status })` exacto (sin `toMatchObject`), así cualquier campo extra rompe el test.
- Riesgo: el caso "baneado" asume que `locals.user.status` viene fresco de DB → Mitigación: el middleware de HU-01.2 ya re-lee `users.status` en cada request; documentar esta dependencia en comentario del handler.
- Riesgo: 403 expone "baneado" a usuarios no-admin → Mitigación: aceptable; el usuario sabe por sí mismo que su cuenta está deshabilitada. No es info sensible para el dueño de la cuenta.
