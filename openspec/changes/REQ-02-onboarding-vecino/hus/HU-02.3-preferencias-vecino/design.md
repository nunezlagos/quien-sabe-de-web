# Diseno tecnico — HU-02.3 — Preferencias de notificación e intereses

**REQ padre:** REQ-02-onboarding-vecino

## Modelo de datos

### Tabla Drizzle

```ts
// src/database/schema.ts (extracto)
export const userPreferences = sqliteTable('user_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  notifyEmail: integer('notify_email', { mode: 'boolean' }).notNull().default(true),
  interests: text('interests', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})
```

### Migracion Drizzle

- Archivo: `src/database/migrations/0005_user_preferences.sql`.
- Cambios:
  - `CREATE TABLE user_preferences (...)` con `FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE`.
  - `CHECK (json_array_length(interests) <= 50)` para limitar el tamaño del array.

## Contrato de API

### `PATCH /api/v1/users/me/profile` extendido [sesión vecino]

Acepta body parcial:
```json
{
  "preferences": {
    "notify_email": false,
    "interests": ["gasfiter", "electricista"]
  }
}
```

Comportamiento de merge:
- `notify_email`: si se envía → reemplaza; si no → conserva.
- `interests`: si se envía → reemplaza el array completo (cliente debe enviar el array final deseado).

Response 200: mismo shape que `GET /api/v1/users/me/profile` extendido con `preferences: { notify_email, interests }`.

Errores: 422 `interés inválido: oficio-inexistente`.

## Validaciones Zod

```ts
// src/lib/validators/preferences.ts
const ALLOWED_INTERESTS = ['gasfiter', 'electricista', 'jardinero', 'pintor', 'gasfiter-emergencias', 'electricista-alta-tension']
  // mantener sincronizado con futura tabla `trades` cuando exista

export const PreferencesPatch = z.object({
  notify_email: z.boolean().optional(),
  interests: z.array(z.string().min(1).max(64).refine(
    (s) => ALLOWED_INTERESTS.includes(s),
    { message: 'interés inválido' }
  )).max(50).optional(),
})
```

El `OnboardingPatch` de HU-02.2 se extiende con un campo opcional `preferences: PreferencesPatch`.

## Componentes UI

- Componente `src/components/onboarding/PreferencesStep.astro` — checkboxes de intereses (lee whitelist del cliente) + toggle de notify_email.
- Reusado en el wizard de HU-02.2 (step 2) y en la futura vista de cuenta (`mockups/account-data.html`).

## Flujo de interaccion (secuencial)

1. Wizard step 2 carga whitelist (hardcoded en cliente hasta que exista endpoint `/trades`).
2. Usuario marca intereses y toggle de notify_email.
3. Step final del wizard junta todo y hace `POST /api/v1/users/me/profile` con `preferences` incluido.
4. Edición posterior desde cuenta: `PATCH /api/v1/users/me/profile` con `preferences` parcial.

## Capa de servicios

```ts
// src/lib/services/preferences.ts
export async function upsertPreferences(db, userId: number, patch: PreferencesPatch): Promise<UserPreferences>
export async function getPreferences(db, userId: number): Promise<UserPreferences | null>
```

El merge con campos no enviados se hace en el service: leer row actual, aplicar patch, upsert.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/preferences.test.ts` | `PreferencesPatch` acepta `notify_email: false`; rechaza `interests: ['oficio-inexistente']` con mensaje; rechaza array > 50 |
| Unit | `tests/unit/preferences/merge.test.ts` | `upsertPreferences` con `notify_email` sólo modifica ese campo, conserva `interests`; con `interests` sólo modifica ese array |
| Integracion | `tests/integration/onboarding/preferences.test.ts` | PATCH inicial crea fila en `user_preferences`; PATCH parcial conserva campos no enviados; interés inválido → 422 |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.1 (tabla `users`), HU-02.2 (extensión de `OnboardingPatch`).
- **Bloquea a:** REQ-17 (segmentación de emails), REQ-06 (filtros de búsqueda por intereses).
- **Recursos compartidos:** `users`, whitelist `ALLOWED_INTERESTS` en `src/lib/constants/interests.ts`.

## Riesgos tecnicos

- Riesgo: whitelist hardcoded diverge del futuro catálogo `trades` → Mitigación: cuando exista tabla `trades` (REQ-05), mover whitelist a query `SELECT slug FROM trades` y mantener `ALLOWED_INTERESTS` como cache invalidado en cada deploy.
- Riesgo: JSON malformado en columna `interests` → Mitigación: Drizzle `.mode('json').$type<string[]>()` fuerza type-check; en escritura validar `JSON.stringify` antes del insert.
- Riesgo: el `1:1` con `users` mediante PK compartida limita a 1 fila por user → Mitigación: PK es `user_id`, correcto para 1:1. Si en futuro se quiere histórico, agregar tabla `user_preferences_history` en migración separada.
