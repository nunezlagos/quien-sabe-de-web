# Diseño técnico — HU-27.4 — Middleware requireRole acepta multi-rol

**REQ padre:** REQ-27-multi-rol-cuenta

## Modelo de datos

No introduce tablas. Lee `user_roles` (HU-27.1) vía `hasAnyRole` (HU-27.1).

## Contrato de API

No introduce endpoints nuevos. Refactoriza middleware existente.

Firma del middleware (en `src/lib/middleware/auth.ts`):
```ts
export async function requireRole(
  roleOrRoles: Role | Role[],
  options?: { exactActive?: boolean }
): Promise<{ user: User, session: Session } | Response>
```

- Si `roleOrRoles` es string, se trata como `roles = [roleOrRoles]`.
- Si es array, valida que el user tenga al menos uno de esos roles (`hasAnyRole`).
- Por defecto, evalúa el set completo del user; `options.exactActive=true` requiere que `active_role` ∈ `roleOrRoles` (caso edge para endpoints que sí quieren estricto).

## Validaciones Zod

No aplica (middleware, no input externo).

## Componentes UI

No aplica.

## Flujo de interacción (secuencial)

### Caso típico: multi-rol accediendo endpoint prestador
1. User `roles=['vecino','prestador']` con `active_role='vecino'` hace `GET /api/v1/providers/me`.
2. Endpoint llama `await requireRole('prestador')`.
3. Middleware lee `Astro.locals.session.user.roles` → `['vecino','prestador']`.
4. `hasAnyRole(['vecino','prestador'], 'prestador')` → true.
5. Retorna `{user, session}`; endpoint continúa.
6. Log debug: `roles=[vecino,prestador], active=vecino, required=prestador → allowed`.

### Caso típico: rol único accediendo endpoint restringido
1. User `roles=['vecino']` hace `GET /api/v1/providers/me`.
2. `requireRole('prestador')`.
3. `hasAnyRole(['vecino'], 'prestador')` → false.
4. Retorna `new Response(JSON.stringify({error: 'forbidden'}), {status: 403})`.

### Caso multi-target: admin o prestador
1. Endpoint admin llama `await requireRole(['prestador','admin'])`.
2. User `roles=['admin']` → `hasAnyRole(['admin'], ['prestador','admin'])` → true.

## Capa de servicios

- `src/lib/services/auth/roles.ts` (HU-27.1): `hasAnyRole(env, userId, roles: Role[]): Promise<boolean>`.
- Refactor `src/lib/middleware/auth.ts`:
  ```ts
  export async function requireRole(roleOrRoles: Role | Role[], options?: { exactActive?: boolean }): Promise<{ user, session } | Response> {
    const session = Astro.locals.session
    if (!session) return forbidden('sin sesión')
    const user = await getUserById(env, session.userId)
    const targets = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
    if (options?.exactActive) {
      if (!targets.includes(session.active_role)) return forbidden('rol activo incorrecto')
    } else {
      const has = await hasAnyRole(env, user.id, targets)
      if (!has) return forbidden(`requiere rol: ${targets.join(' | ')}`)
    }
    if (import.meta.env.DEBUG_AUTH) {
      console.log(`[auth] user=${user.id} roles=[${user.roles.join(',')}] active=${session.active_role} required=${targets.join('|')} → allowed`)
    }
    return { user, session }
  }
  ```

### Migración de callsites
- `grep -r "requireRole(" src/pages/api/v1` debe seguir funcionando sin cambios (backward-compat).
- Documentar en README que la firma ahora acepta `Role | Role[]`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/middleware/require-role.test.ts` — `requireRole('prestador')` con `roles=['vecino','prestador']` → acepta; con `roles=['vecino']` → 403; `requireRole(['prestador','admin'])` con `roles=['admin']` → acepta; con `options.exactActive=true` y `active_role='vecino'` con `roles=['vecino','prestador']` y target `prestador` → 403; mismo sin `exactActive` → acepta. |
| Integración | `tests/integration/auth/require-role-multi.test.ts` — fixture user multi-rol: requests a endpoints prestador pasan; requests a admin fallan (403). Verificar logs de debug si `DEBUG_AUTH=1`. |
| E2E | `tests/e2e/multi-role-access.spec.ts` — login user multi-rol → `active_role='vecino'` → acceder `/api/v1/providers/me` (de prestador) → 200; acceder `/api/v1/admin/users` → 403. |

## Dependencias y secuencia

- **Bloqueado por:** HU-27.1 (helper `hasAnyRole`), REQ-01 (middleware `requireRole` original).
- **Bloquea a:** ninguna HU directa (todos los endpoints protegidos usan requireRole y se benefician automáticamente).
- **Recursos compartidos:** `src/lib/middleware/auth.ts`, `src/lib/services/auth/roles.ts`.

## Riesgos técnicos

- Riesgo: el backward-compat oculta bugs en callsites que querían strict mode → Mitigación: el `options.exactActive` está disponible; documentar.
- Riesgo: `getUserById` agrega query por request → Mitigación: la sesión ya carga el user en `Astro.locals.user`; middleware usa ese cache. Documentar.
- Riesgo: el logging en producción inunda los logs → Mitigación: gate con `import.meta.env.DEBUG_AUTH` (false por default).