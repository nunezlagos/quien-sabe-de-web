# Diseño técnico — HU-22.5 — Consentimiento granular por finalidad

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

### Nueva tabla Drizzle

```ts
// src/database/schema.ts
export const userConsents = sqliteTable('user_consents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['communications', 'analytics', 'public_profile', 'marketing'] }).notNull(),
  granted: integer('granted', { mode: 'boolean' }).notNull(),
  grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  source: text('source', { enum: ['banner', 'modal', 'settings', 'api'] }).notNull().default('settings'),
}, (t) => ({
  byUser: index('idx_user_consents_user').on(t.userId, t.grantedAt),
  byUserPurpose: index('idx_user_consents_user_purpose').on(t.userId, t.purpose, t.grantedAt),
}))
```

### Migración Drizzle
- `src/database/migrations/00XX_user_consents.sql`:
  - `CREATE TABLE user_consents (...)` con índices.
  - Foreign key con `ON DELETE CASCADE`.
  - Sin CHECK sobre enum: el schema Drizzle valida en runtime.

### Tabla `users` (no requiere cambios)
- El "consent actual" se deriva del último row de `user_consents` por `(user_id, purpose)`. Esto evita duplicación y mantiene el append-only puro.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/users/me/consent` | PATCH | sesión | `{ communications?: bool, analytics?: bool, public_profile?: bool, marketing?: bool }` | `{ consents: Record<purpose, bool> }` (estado actual) | 401 (sin sesión), 400 (body inválido) |

Si el body tiene `{communications: false}` se inserta fila en `user_consents` con `granted=0`.

## Validaciones Zod

```ts
// src/lib/validators/consent/granular.ts
export const consentToggleSchema = z.object({
  communications: z.boolean().optional(),
  analytics: z.boolean().optional(),
  public_profile: z.boolean().optional(),
  marketing: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un toggle" }
)
```

## Componentes UI

No obligatorio en esta HU. La UI de toggles (sección "Mis consentimientos" en `/dashboard-user`) puede llegar en REQ-22 futuro. Esta HU es backend + endpoint. Si se desea UI mínima, agregar card en `mockups/dashboard-user.html:71` con toggles switch.

### Middleware
- `src/lib/middleware/consent.ts` con `consentRequired(purpose)`:
  - Lee `user_consents` (último row por `user_id, purpose`) para el user actual.
  - Si `granted === false` o no hay fila (default: requiere consentimiento explícito) → bloquea con 403 + `{error: "consent_required", purpose}`.
- Aplicar a endpoints sensibles:
  - `consentRequired('analytics')` en endpoints de REQ-18.
  - `consentRequired('public_profile')` en `GET /p/:slug` cuando el prestador es el dueño (o REQ-06 search filtra directamente).

## Flujo de interacción (secuencial)

1. Usuario autenticado envía `PATCH /api/v1/users/me/consent` con `{communications: false}`.
2. `requireSession` → 401 sin sesión.
3. Parse con `consentToggleSchema` → 400 si vacío.
4. Para cada campo presente en body, INSERT nueva fila en `user_consents` con `granted=bool, source='api'`.
5. Query agregada: `SELECT purpose, granted FROM user_consents WHERE user_id = ? AND id IN (SELECT MAX(id) FROM user_consents WHERE user_id = ? GROUP BY purpose)`.
6. Responde 200 con `{consents: {communications: false, analytics: true, public_profile: true}}`.

## Capa de servicios

- `src/lib/services/consent/granular.ts`:
  - `recordConsentChanges(env, userId, toggles, source): Promise<void>`.
  - `getCurrentConsents(env, userId): Promise<Record<Purpose, boolean>>`.
- `src/lib/middleware/consent.ts`:
  - `consentRequired(purpose)` — bloquea si `!getCurrentConsent(env, userId, purpose)`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/consent-granular.test.ts` — schema acepta objeto con al menos 1 toggle; rechaza body vacío; rechaza tipos no-boolean. |
| Integración | `tests/integration/compliance/consent.test.ts` — fixture user: PATCH `{communications: false}` → 200 + fila en `user_consents` con `granted=0`; segunda PATCH `{communications: true}` → 200 + 2 filas en `user_consents`; `getCurrentConsents` retorna el último valor; middleware `consentRequired('analytics')` con user sin fila → 403; con user que consintió → 200. |
| E2E | `tests/e2e/consent-toggle.spec.ts` (opcional) — login user → /dashboard-user → toggle "Comunicaciones" → ver toast "Preferencia guardada". |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión).
- **Bloquea a:** REQ-06 (filtro `public_profile` en search), REQ-18 (analytics respeta consent).
- **Recursos compartidos:** `src/database/schema.ts`, KV binding.

## Riesgos técnicos

- Riesgo: dos toggles simultáneos (PATCH con 3 campos) requiere INSERT múltiple atómico → Mitigación: usar `db.batch([insert1, insert2, insert3])`.
- Riesgo: el middleware `consentRequired` agrega query a cada request sensible → Mitigación: cachear `getCurrentConsents` 60s en KV keyed por `consent:{userId}`. Invalidar en cada PATCH.
- Riesgo: el enum `purpose` no es extensible → Mitigación: documentar que agregar finalidad nueva requiere migración.