# Diseno tecnico — HU-16.6 — Versionado legal y re-aceptación

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

### Cambios sobre `users` (Drizzle)

```ts
// src/database/schema.ts (extracto)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['user', 'provider', 'admin'] }).default('user'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // nuevos:
  acceptedTermsAt: integer('accepted_terms_at', { mode: 'timestamp' }),
  acceptedTermsVersion: text('accepted_terms_version'),
});
```

### Migracion

`src/database/migrations/00XX_legal_reacceptance.sql`:
- `ALTER TABLE users ADD COLUMN accepted_terms_at INTEGER;`
- `ALTER TABLE users ADD COLUMN accepted_terms_version TEXT;`

## Contrato de API

### `POST /api/v1/users/me/accept-terms`

Request:
```json
{ "version": "v2" }
```

Response 200:
```json
{ "success": true, "data": { "accepted_at": "2026-06-18T10:00:00Z", "version": "v2" } }
```

Response 400 (Zod): `{ "success": false, "error": "version must match v\\d+" }`
Response 401 si no hay sesión.
Response 409 si la versión es anterior a la vigente (carrera).

## Validaciones Zod

```ts
// src/lib/validators/legal.ts (ampliar)
export const acceptTermsBodySchema = z.object({
  version: z.string().regex(/^v\d+$/),
});
```

## Componentes UI

- `src/middleware.ts` — agregar `enforceLegalAcceptance` al `sequence()`.
  Lógica:
  1. Si `Astro.locals.user` undefined → next().
  2. Resolver `currentUser.acceptedTermsVersion` y la versión vigente
     (`getCurrentLegalVersion(db, 'terms')`).
  3. Si `acceptedTermsVersion !== current && Astro.url.pathname !== '/terms' && !Astro.url.pathname.startsWith('/api/')` → redirect a `/terms?reaccept=true&return=<path>`.
  4. Permitir `/api/v1/users/me/accept-terms` (de lo contrario, un POST no llegaría).
- `src/pages/terms.astro` (extender el de HU-16.3) — si query `reaccept=true`,
  mostrar banner amarillo arriba con texto "Tu versión aceptada es vN. La
  vigente es vM. Aceptar para continuar." y un form POST al endpoint.
- `src/pages/api/v1/users/me/accept-terms.ts` — endpoint POST.

```ts
// src/lib/middleware/legal-acceptance.ts (firmas)
export const enforceLegalAcceptance: MiddlewareHandler = async (ctx, next) => { ... }
```

## Flujo de interaccion (secuencial)

1. Usuario autenticado navega a `/dashboard/user`.
2. `securityHeaders` → `validateJsonMiddleware` → `enforceLegalAcceptance`.
3. Middleware consulta `users.acceptedTermsVersion` (vía sesión) y `legal_versions` para `terms` (última fila).
4. Si difieren y la URL no es `/terms` ni `/api/...`, redirect 302 a `/terms?reaccept=true&return=/dashboard/user`.
5. Usuario ve banner amarillo + form. Submit → POST al endpoint.
6. Endpoint valida Zod, hace `UPDATE users SET accepted_terms_version = ?, accepted_terms_at = now() WHERE id = ?`.
7. Response 200; cliente hace `Astro.navigate(returnTo)` → usuario entra al destino original.

## Capa de servicios

```ts
// src/lib/services/legal-versions.ts (ampliar HU-16.3)
export async function getCurrentLegalVersion(
  db: Db,
  slug: 'terms' | 'privacy',
): Promise<string | null>;

// src/lib/services/users.ts (nuevo helper)
export async function recordTermsAcceptance(
  db: Db,
  userId: number,
  version: string,
): Promise<{ acceptedAt: Date }>;
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/legal.test.ts` | `acceptTermsBodySchema` rechaza version inválida |
| Integracion | `tests/integration/legal/reaccept.test.ts` | `getCurrentLegalVersion` retorna la más reciente por `published_at`; `recordTermsAcceptance` actualiza columnas |
| Integracion | `tests/integration/middleware/legal-acceptance.test.ts` | middleware redirige cuando hay desfase; NO redirige a `/api/...`; NO redirige anónimos |
| E2E | `tests/e2e/legal-reaccept.spec.ts` | login → visita dashboard con version vieja → redirect a `/terms?reaccept=true` → POST al endpoint → vuelve al dashboard |

## Dependencias y secuencia

- **Bloqueado por:** HU-16.1, HU-16.3 (tabla `legal_versions`), REQ-01 (sesiones).
- **Bloquea a:** ninguno directo; habilita cumplimiento futuro de Ley 19.628.
- **Recursos compartidos:** `src/middleware.ts`, `src/database/schema.ts`, `src/lib/services/legal-versions.ts`.

## Riesgos tecnicos

- Riesgo: el middleware corre en cada request y agrega latencia por la query a `legal_versions` → Mitigación: cachear en `Astro.locals` por request (ya está dentro de un solo request) y opcional KV cache 5 min (decisión diferida).
- Riesgo: redirect a `/api/...` rompe clientes que esperan JSON → Mitigación: la condición excluye `/api/` explícitamente; test lo cubre.
- Riesgo: la migración `ALTER TABLE` falla si las columnas ya existen (re-deploy) → Mitigación: usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (D1/SQLite >= 3.35); verificar versión en T1.
