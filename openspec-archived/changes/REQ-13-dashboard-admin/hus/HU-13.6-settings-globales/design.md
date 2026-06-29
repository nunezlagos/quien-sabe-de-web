# Diseno tecnico — HU-13.6 — Settings globales editables

**REQ padre:** REQ-13-dashboard-admin

## Modelo de datos

### Migracion Drizzle

```ts
// src/database/schema.ts (extracto)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(), // JSON serializado
  updatedBy: integer('updated_by').notNull().references(() => users.id),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})
```

SQL equivalente: `CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_by INTEGER NOT NULL REFERENCES users(id), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));`

### Settings conocidos (seed)

```ts
// src/lib/services/settings/registry.ts (firmas)
export const SETTINGS_REGISTRY = {
  rate_limit_contact: { schema: z.number().int().min(1).max(1000), default: 20, description: 'Contactos máximos por IP por hora' },
  ticket_sla_hours: { schema: z.number().int().min(1).max(168), default: 48, description: 'Horas para primera respuesta de ticket' },
  legal_terms_version: { schema: z.string().regex(/^\d+\.\d+\.\d+$/), default: '1.0.0', description: 'Versión actual de términos' },
  admin_audit_sampling_pct: { schema: z.number().int().min(0).max(100), default: 100, description: '% de accesos admin auditados' },
  kpis_cache_ttl_seconds: { schema: z.number().int().min(0).max(3600), default: 300, description: 'TTL del cache de KPIs' },
} as const
```

## Contrato de API

### `GET /api/v1/admin/settings`

- **Auth:** admin.
- **Response 200:**
  ```json
  {
    "settings": {
      "rate_limit_contact": 20,
      "ticket_sla_hours": 48,
      "legal_terms_version": "1.0.0",
      "admin_audit_sampling_pct": 100,
      "kpis_cache_ttl_seconds": 300
    },
    "schema_info": [
      { "key": "rate_limit_contact", "type": "number", "default": 20, "description": "..." }
    ]
  }
  ```

### `PATCH /api/v1/admin/settings`

- **Body (subset):**
  ```json
  { "rate_limit_contact": 50, "kpis_cache_ttl_seconds": 600 }
  ```
- **Response 200:** `{ ok: true, settings: { ... } }` (settings efectivos después del patch).
- **Response 422:** `{ error: "validation", details: [{ path: "rate_limit_contact", message: "min 1" }] }`
- **Side effects:**
  - UPDATE de cada fila en `settings`.
  - `env.KV.delete('settings:current')`.
  - `logAdminAction(env, actor.id, 'update', 'settings', key, before, after)` por cada key cambiada.
  - Si key es `kpis_cache_ttl_seconds`, también `invalidateKpisCache(env)`.

## Validaciones Zod

```ts
// src/lib/services/settings/registry.ts (ya mostrado arriba)
export type SettingsKey = keyof typeof SETTINGS_REGISTRY
export type SettingsValue<K extends SettingsKey> = z.infer<typeof SETTINGS_REGISTRY[K]['schema']>

export const settingsPatchSchema = z.object(
  Object.fromEntries(
    Object.entries(SETTINGS_REGISTRY).map(([k, def]) => [k, def.schema.partial()])
  )
).refine((b) => Object.keys(b).length > 0, { message: 'al menos un campo' })
```

## Componentes UI

- `src/components/admin/SettingsPanel.astro` — formulario con una fila por setting conocido: label + descripción + input (number/text según schema) + botón "Guardar" por fila + botón "Guardar todo".
- `src/components/admin/SettingField.astro` — campo individual con label, descripción, validación inline, valor actual.

## Flujo de interaccion (secuencial)

1. Admin GET `/dashboard-admin?section=settings` → SSR llama `GET /api/v1/admin/settings`.
2. Servicio `getSettings(env)`:
   - Lee `env.KV.get('settings:current')`; si existe y parsea → retorna (cache).
   - Si no → lee `SELECT * FROM settings`, construye objeto con defaults si alguna key falta, `env.KV.put('settings:current', JSON.stringify(...), { expirationTtl: 3600 })`.
3. Admin edita `rate_limit_contact` a 50 → click "Guardar" → `PATCH /api/v1/admin/settings` con `{ rate_limit_contact: 50 }`.
4. Server valida cada key con su schema específico, hace UPDATE, invalida cache, audit log → 200.
5. Cliente refresca lista con valores efectivos.

## Capa de servicios

```ts
// src/lib/services/admin/settings.ts (firmas)
export type SettingsObject = { [K in SettingsKey]: SettingsValue<K> }

export async function getSettings(env: Env): Promise<SettingsObject>

export async function patchSettings(
  env: Env,
  actorId: number,
  patch: Partial<SettingsObject>,
): Promise<SettingsObject>
// throws: ValidationError (mapea a 422)
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/admin-settings/registry.test.ts` | Cada key con su schema; defaults correctos |
| Unit | `tests/unit/admin-settings/patch-schema.test.ts` | Body vacío rechaza; rate_limit_contact=-1 rechaza |
| Integracion | `tests/integration/admin/settings-get.test.ts` | Devuelve defaults si tabla vacía; cache HIT segunda llamada |
| Integracion | `tests/integration/admin/settings-patch.test.ts` | PATCH OK + cache invalidado + audit log + kpis cache también invalidado |
| Integracion | `tests/integration/admin/settings-rbac.test.ts` | Vecino 403; sin sesión 401 |
| Integracion | `tests/integration/admin/settings-validation.test.ts` | rate_limit_contact=-1 → 422 con detalle |
| E2E | `tests/e2e/admin-settings.spec.ts` | Admin cambia setting; próxima lectura refleja cambio |

## Dependencias y secuencia

- **Bloqueado por:** HU-13.1 (guard), HU-13.7 (audit log).
- **Bloquea a:** REQ-18 (observabilidad lee settings), HU-13.4 (lee `kpis_cache_ttl_seconds`), HU-13.1 (lee `admin_audit_sampling_pct`).
- **Recursos compartidos:** binding KV, tabla `admin_audit_log`.

## Riesgos tecnicos

- Riesgo: la registry crece y el schema object se vuelve gigante → Mitigación: usar `Object.fromEntries` para generar el Zod object dinámicamente; mantener la registry como single source of truth.
- Riesgo: cache stale en KV si la invalidación falla → Mitigación: el cache tiene TTL de 1h; aceptable como degradación; tests verifican que la invalidación ocurre.
- Riesgo: dos admins editan el mismo setting simultáneamente → Mitigación: last-writer-wins con audit log de ambos cambios; aceptable para settings que cambian <1 vez/mes.
