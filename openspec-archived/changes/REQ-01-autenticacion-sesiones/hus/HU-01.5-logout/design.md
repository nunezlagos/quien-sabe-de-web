# Diseno tecnico — HU-01.5 — Logout limpia sesión KV y cookie

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

Sin cambios. No agrega tablas ni columnas. Sólo consume el helper `destroySession(env, token)` de HU-01.2.

## Contrato de API

### `POST /api/v1/auth/logout` [público en el sentido de idempotente, lee cookie si existe]

Request: sin body. Cookie `session=<token>` opcional.
Response: 204 No Content.

Headers de respuesta cuando había cookie:
```
Set-Cookie: session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
```

Comportamiento:
1. Lee cookie `session`. Si no existe → return 204 (sin tocar KV).
2. `destroySession(env, token)` — best-effort, no falla si la key ya no existe.
3. `clearSessionCookie(cookies)` — setea Max-Age=0 con los mismos flags.
4. Return 204.

## Validaciones Zod

No aplica (endpoint sin body).

## Componentes UI

- Botón "Cerrar sesión" en headers de dashboards (REQ-11, REQ-12) — esta HU sólo define el endpoint. El botón hace `fetch('/api/v1/auth/logout', { method: 'POST' })` y al recibir 204 hace `window.location.href = '/'`.

## Flujo de interaccion (secuencial)

1. Usuario autenticado hace click en "Cerrar sesión".
2. Frontend envía `POST /api/v1/auth/logout` con `credentials: 'include'`.
3. Endpoint ejecuta flujo descrito arriba.
4. Frontend recibe 204 → redirige a `/`.

## Capa de servicios

Reusa sin cambios:
- `src/lib/services/auth/session.ts` → `destroySession(env, token)` (de HU-01.2).
- `src/lib/utils/cookies.ts` → `clearSessionCookie(cookies)` (de HU-01.1).

Nuevo endpoint: `src/pages/api/v1/auth/logout.ts`.

```ts
// src/pages/api/v1/auth/logout.ts (pseudocodigo)
export const POST: APIRoute = async ({ cookies, locals }) => {
  const token = cookies.get('session')?.value
  if (token) {
    try {
      await destroySession(locals.runtime.env.SESSION, token)
    } catch (e) {
      console.error('logout: destroySession failed', e)
      // best-effort: seguimos para limpiar cookie igual
    }
    clearSessionCookie(cookies)
  }
  return new Response(null, { status: 204 })
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integracion | `tests/integration/auth/logout.test.ts` | 204 con cookie válida + key KV borrada + Set-Cookie Max-Age=0; 204 sin cookie (sin acceso a KV); 204 con cookie inválida (idempotente) |
| E2E | `tests/e2e/auth-logout.spec.ts` | login → logout → intentar `/dashboard-user` → redirect a `/login` |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.2 (`destroySession` + `clearSessionCookie`).
- **Bloquea a:** REQ-11, REQ-12, REQ-13 (botones en headers de dashboards).
- **Recursos compartidos:** binding `SESSION`, `src/lib/utils/cookies.ts`.

## Riesgos tecnicos

- Riesgo: `destroySession` arroja error de KV no capturado → Mitigación: try/catch + log; el endpoint igual responde 204 (el cliente no puede hacer nada útil si KV falla).
- Riesgo: el endpoint se invoca antes de que el middleware hidrate `locals.user` → Mitigación: el endpoint no depende de `locals.user`, sólo lee la cookie directo. Es independiente del middleware.
- Riesgo: logging del token en logs de error → Mitigación: redactar el token en el `console.error` (mostrar solo primeros 8 chars).
