# Diseno tecnico — HU-13.1 — Middleware estricto para rutas admin

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

No introduce tablas nuevas para el guard en sí. La auditoría se apoya en `admin_audit_log` (definida y migrada en HU-13.7; si HU-13.7 no está lista cuando HU-13.1 deploya, el middleware degrada a log en consola sin romper el flujo).

## Contrato de API

Esta HU no expone endpoints nuevos. Su contrato es el comportamiento de los existentes:

- `GET /dashboard-admin` (página Astro):
  - Sin sesión → `302 /login?next=/dashboard-admin`
  - Sesión con rol !== `admin` → `403`
  - Sesión admin → `200` + fila en `admin_audit_log`
- `GET /api/v1/admin/*` (todos):
  - Sin sesión → `401`
  - Sesión con rol !== `admin` → `403`
  - Sesión admin → comportamiento normal del endpoint + (opcional) fila en `admin_audit_log` para mutaciones

## Validaciones Zod

No aplica — el guard no valida body, sólo rol. La validación del body de cada endpoint admin sigue siendo responsabilidad de cada HU (HU-13.2, 13.3, etc).

```ts
// src/lib/middleware/requireAdmin.ts (firmas, no logica)
export interface AdminGuardResult {
  ok: boolean
  status: 200 | 302 | 401 | 403
  redirectTo?: string
  reason?: 'no_session' | 'forbidden_role'
}

export function requireAdmin(
  ctx: { user: { id: number; role: string } | null; request: Request; url: URL },
  opts?: { audit?: boolean; kind?: 'page' | 'api' },
): Promise<AdminGuardResult>
```

## Componentes UI

No aplica. Backend puro.

## Flujo de interaccion (secuencial)

1. Request llega a `src/middleware.ts`.
2. Si path empieza con `/dashboard-admin` o `/api/v1/admin/` → invoca `requireAdmin(ctx, { audit: true })`.
3. `requireAdmin`:
   - Lee `Astro.locals.user`. Si null:
     - Si `kind === 'page'` → `{ ok: false, status: 302, redirectTo: '/login?next=' + pathname }`.
     - Si `kind === 'api'` → `{ ok: false, status: 401 }`.
   - Si `user.role !== 'admin'` → `{ ok: false, status: 403, reason: 'forbidden_role' }`.
   - Si `audit: true` → enqueue `logAdminAction(ctx, 'view', path, null, null)`.
   - Retorna `{ ok: true, status: 200 }`.
4. Middleware traduce el resultado:
   - `302` → `ctx.redirect(redirectTo)`.
   - `401 / 403` → `new Response(null, { status })`.
   - `200` → `ctx.next()`.

## Capa de servicios

```ts
// src/lib/middleware/requireAdmin.ts
export async function requireAdmin(
  ctx: AdminGuardContext,
  opts: AdminGuardOptions = {},
): Promise<AdminGuardResult>

// src/lib/services/audit/admin.ts (HU-13.7 lo define, aca solo referenciamos)
export async function logAdminAction(
  env: Env,
  actorId: number,
  action: 'view' | 'create' | 'update' | 'delete' | 'refund',
  entity: string,
  entityId: string | number | null,
  before: unknown,
  after: unknown,
): Promise<void>
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/middleware/requireAdmin.test.ts` | 6 casos: page sin sesión, page vecino, page admin, api sin sesión, api vecino, api admin |
| Unit | `tests/unit/middleware/auditSampling.test.ts` | sampling 0% no loguea; 100% sí |
| Integracion | `tests/integration/middleware/admin-routes.test.ts` | Barrido de 8 rutas admin: todas 403 sin admin |
| Integracion | `tests/integration/middleware/admin-audit.test.ts` | GET admin → fila en `admin_audit_log` con path correcto |
| E2E | `tests/e2e/admin-guard.spec.ts` | Vecino intenta entrar → redirect/403; admin entra → dashboard |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión + rol en `Astro.locals.user`), HU-13.7 (tabla `admin_audit_log` para auditoría — opcional al inicio).
- **Bloquea a:** TODAS las HUs de REQ-13 (HU-13.2 a HU-13.7) — el guard es prerequisito de cualquier endpoint admin.
- **Recursos compartidos:** `src/middleware.ts`, `Astro.locals`.

## Riesgos tecnicos

- Riesgo: el middleware global corre antes que el endpoint que matchea `/api/v1/admin/*` → Mitigación: verificar en T1 que el orden de match en `src/middleware.ts` prioriza el guard antes del handler.
- Riesgo: el helper `requireAdmin` se llama dos veces para el mismo request (middleware + handler) → Mitigación: el helper es idempotente y barato; la doble invocación sólo agrega 1 query (audit) si está habilitada.
- Riesgo: `admin_audit_log` no existe aún en deploy inicial → Mitigación: try/catch envuelve la escritura de auditoría; si la tabla no existe, se loguea en consola con `console.warn` y se continúa.
