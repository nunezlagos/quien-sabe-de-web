# Diseño técnico — HU-22.4 — Eliminar cuenta con soft delete y anonimización

**REQ padre:** REQ-22-compliance-ley-19628

## Modelo de datos

### Cambios de schema

```ts
// src/database/schema.ts — diff

// 1) users (existente REQ-01): agregar columnas
export const users = sqliteTable('users', {
  // ... columnas existentes
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  anonymizedAt: integer('anonymized_at', { mode: 'timestamp' }),
  // email cambia de unique estricto a unique-per-active: mantener UNIQUE pero aceptar múltiples deleted-<uuid>@... mediante cambio a índice parcial
})

// 2) reviews (existente REQ-09): agregar columna
export const reviews = sqliteTable('reviews', {
  // ... columnas existentes
  userIdDisplay: text('user_id_display').notNull().default(''),
})
```

### Migración Drizzle
- `src/database/migrations/00XX_account_deletion.sql`:
  - `ALTER TABLE users ADD COLUMN deleted_at INTEGER` (timestamp mode).
  - `ALTER TABLE users ADD COLUMN anonymized_at INTEGER`.
  - Recrear índice UNIQUE de `users.email` como parcial: `CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL`.
  - `ALTER TABLE reviews ADD COLUMN user_id_display TEXT NOT NULL DEFAULT ''`.
  - Backfill: `UPDATE reviews SET user_id_display = u.display_name FROM users u WHERE reviews.user_id = u.id`.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/users/me` | DELETE | sesión | `{"confirm": "ELIMINAR"}` | 204 No Content | 401 (sin sesión), 422 (confirm faltante o incorrecto) |

## Validaciones Zod

```ts
// src/lib/validators/compliance/delete.ts
export const deleteAccountSchema = z.object({
  confirm: z.literal('ELIMINAR'),
})
```

## Componentes UI

No aplica. Cliente que llama DELETE puede ser un botón "Eliminar cuenta" en `/dashboard-user` (futuro). Esta HU es backend.

## Flujo de interacción (secuencial)

1. Usuario autenticado envía `DELETE /api/v1/users/me` con `{confirm: "ELIMINAR"}`.
2. `requireSession` → 401 sin sesión.
3. Parse con `deleteAccountSchema` → 422 si `confirm` falta o no es literal `"ELIMINAR"`.
4. Service `deleteAccount(env, userId)` en transacción D1 batch:
   - UPDATE users: SET email = 'deleted-' || uuid() || '@quien-sabe.local', display_name = 'Vecino eliminado', deleted_at = unixepoch(), anonymized_at = unixepoch().
   - UPDATE reviews SET user_id_display = 'Vecino eliminado' WHERE user_id = ?.
   - UPDATE providers SET status = 'deleted' WHERE user_id = ? (si existe).
   - UPDATE contact_events: no requiere cambio (no tiene PII directa del autor).
   - UPDATE user_consents: SET granted = 0 WHERE user_id = ?.
5. `revokeAllSessions(env, userId)` reusa helper de HU-19.4 (`env.SESSION.delete('session:' + sessionId)` para cada sesión activa).
6. Responde 204 No Content.

## Capa de servicios

- `src/lib/services/compliance/delete-account.ts`:
  - `deleteAccount(env, userId): Promise<void>` — orquesta el batch.
- Reuso de `revokeAllSessions(env, userId)` de HU-19.4.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/delete-account.test.ts` — schema acepta `{confirm: "ELIMINAR"}`; rechaza `{confirm: "eliminar"}` (case sensitive); rechaza body vacío; rechaza `{confirm: "ELIMINAR ", con espacio}` (trim). |
| Integración | `tests/integration/compliance/delete-account.test.ts` — fixture user con provider + 2 reseñas + 1 contacto + 1 sesión KV: DELETE devuelve 204; verifica `users.email`, `users.deleted_at`, `users.anonymized_at`; verifica `reviews.user_id_display = "Vecino eliminado"`; verifica `providers.status = 'deleted'`; verifica sesión KV borrada (segunda request con misma cookie devuelve 401); DELETE sin confirm devuelve 422. |
| E2E | `tests/e2e/delete-account-flow.spec.ts` (opcional) — login user → /dashboard-user → click "Eliminar cuenta" → modal confirma con input "ELIMINAR" → submit → redirige a `/` con mensaje "Tu cuenta fue eliminada". |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (sesión), REQ-04 (tabla `providers`), REQ-09 (reseñas), HU-19.4 (helper `revokeAllSessions`).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `src/lib/services/sessions/revoke.ts` (HU-19.4), D1 binding, KV binding.

## Riesgos técnicos

- Riesgo: índice UNIQUE de email rompe al setear `deleted-<uuid>@quien-sabe.local` si dos users generan mismo uuid → Mitigación: usar `crypto.randomUUID()` (RFC 4122 v4) garantiza unicidad práctica.
- Riesgo: `user_id_display` queda vacío para reseñas preexistentes antes del backfill → Mitigación: la migración incluye `UPDATE reviews SET user_id_display = u.display_name FROM users u WHERE reviews.user_id = u.id` ANTES de cambiar a `NOT NULL DEFAULT ''`. Si la columna se crea con default, el backfill la sobreescribe. Documentar el orden.
- Riesgo: `db.batch` con muchos UPDATE excede 50 statements → Mitigación: sólo son 4-5 UPDATEs; bien dentro del límite.