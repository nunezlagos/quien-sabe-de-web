# Diseño técnico — HU-21.2 — Selector de oficio y multi-comuna

**REQ padre:** REQ-21-onboarding-prestador

## Modelo de datos

### Tabla Drizzle `provider_communes`

```ts
// src/database/schema.ts (extracto nuevo)
export const providerCommunes = sqliteTable('provider_communes', {
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  communeId: integer('commune_id')
    .notNull()
    .references(() => communes.id, { onDelete: 'restrict' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  pk: primaryKey({ columns: [t.providerId, t.communeId] }),
  byCommune: index('idx_provider_communes_commune').on(t.communeId),
}))
```

PK compuesta previene duplicados. Índice secundario `byCommune` acelera el filtro de buscador "prestadores que cubren comuna X" (REQ-06).

### Migración Drizzle

`src/database/migrations/00XX_provider_communes.sql`:
- `CREATE TABLE provider_communes (...)` con la PK compuesta.
- Foreign keys con `PRAGMA foreign_keys = ON` activo en `src/database/client.ts`.

### Seeds Drizzle

`src/database/seeds/trades.ts` — array basado en `mockups/js/data.js:2-10`:
```ts
export const TRADES_SEED = [
  { id: 1, name: 'Gasfiter', slug: 'gasfiter' },
  { id: 2, name: 'Electricista', slug: 'electricista' },
  { id: 3, name: 'Maestro', slug: 'maestro' },
  { id: 4, name: 'Jardinero', slug: 'jardinero' },
  { id: 5, name: 'Programador', slug: 'programador' },
  { id: 6, name: 'Pintor', slug: 'pintor' },
  { id: 7, name: 'Costurera', slug: 'costurera' },
] as const
```

`src/database/seeds/communes.ts` — array basado en `mockups/js/data.js:12-16` (14 comunas).

Idempotencia: `INSERT OR IGNORE` por `id` (la tabla `communes` ya viene del REQ-02).

## Contrato de API

| Endpoint | Método | Auth | Response 200 | Cache |
|---|---|---|---|---|
| `/api/v1/catalog/trades` | GET | público | `[{id, name, slug}]` | `public, max-age=3600` |
| `/api/v1/catalog/communes` | GET | público | `[{id, name, slug, region}]` | `public, max-age=3600` |

Orden de respuesta: alfabético por `name` (estable entre requests).

## Validaciones Zod

```ts
// src/lib/validators/catalog.ts
export const tradeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
})

export const communeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).max(60),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  region: z.string().default('RM'),
})
```

Validador para HU-21.3 (consumido desde el POST del wizard):
```ts
export const communeIdsSchema = z.array(z.number().int().positive()).min(1)
```

## Componentes UI

### Componente Astro
- `src/components/onboarding/MultiCommuneSelector.astro` — props `{ communes: Array<{id, name}> }`.
  - Renderiza grid `grid-cols-2 md:grid-cols-3 gap-2` con `<label>` + `<input type="checkbox" name="communeIds[]" value={commune.id}>` por comuna.
  - Estilos heredados de la card mockup: `bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-primary/50 transition`.
  - Helper visual de conteo: `<span id="commune-count">0 seleccionadas</span>` que se actualiza con JS vanilla (`change` listener sumando checks).
  - Validación visual: si count === 0 al submit, browser muestra `setCustomValidity` en el primer checkbox.

### Integración con `ProviderWizard`
- HU-21.1 dejó un `<slot name="cobertura" />` entre bloque 1 y bloque 2. En esta HU, `create-trade.astro` pasa el slot así:
  ```astro
  <ProviderWizard trades={trades} communes={communes}>
    <MultiCommuneSelector slot="cobertura" communes={communes} />
  </ProviderWizard>
  ```

### Comportamiento "Otro"
- En el `<select name="tradeId">`, la opción `<option value="otro">` dispara (vía listener inline) un `<input name="tradePendingApproval" class="hidden">` que aparece sólo cuando se elige "otro".

## Flujo de interacción (secuencial)

1. SSR de `/create-trade` llama `listTrades(env)` y `listCommunes(env)` en paralelo.
2. Renderiza `ProviderWizard` con los catálogos y `<MultiCommuneSelector>` en el slot.
3. Usuario elige oficio (o "Otro" + free-text) y al menos 1 comuna.
4. Submit → POST a HU-21.3 con `communeIds: number[]` en el body.
5. HU-21.3 hace `INSERT INTO provider_communes` en transacción junto con `INSERT INTO providers`.

## Capa de servicios

`src/lib/services/catalog/index.ts`:
- `listTrades(env): Promise<Trade[]>` — `SELECT id, name, slug FROM trades ORDER BY name ASC`.
- `listCommunes(env): Promise<Commune[]>` — `SELECT id, name, slug, region FROM communes ORDER BY name ASC`.

`src/lib/services/catalog/coverage.ts` (consumido por HU-21.3):
- `assignCommunesToProvider(env, providerId, communeIds): Promise<void>` — INSERT bulk atómico.
- `getProviderCommunes(env, providerId): Promise<Commune[]>` — usado por HU-21.3 (eager load post-insert).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Integración | `tests/integration/catalog/trades.test.ts` | `listTrades` devuelve 7 oficios en orden alfabético, formato JSON correcto, `Cache-Control` header. |
| Integración | `tests/integration/catalog/communes.test.ts` | `listCommunes` devuelve ≥14 comunas, formato JSON. |
| Integración | `tests/integration/onboarding/provider-communes.test.ts` | Insert válido, PK compuesta rechaza duplicados, FK cascade borra filas al borrar `provider`. |
| E2E | `tests/e2e/create-trade-communes.spec.ts` | Wizard muestra selector; submit con 0 comunas muestra error visual; submit con 3 persiste 3 filas. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (tabla `communes` con seed 52 comunas), HU-21.1 (slot `cobertura` en `ProviderWizard`).
- **Bloquea a:** HU-21.3 (handler POST recibe `communeIds[]`), REQ-06 (filtro de buscador por comuna).
- **Recursos compartidos:** `src/database/schema.ts`, `src/lib/services/catalog/`, `src/components/onboarding/`.

## Riesgos técnicos

- Riesgo: orden alfabético rompe expectativa del mockup (mockup ordena Gasfiter primero) → Mitigación: documentar que el orden es por `name ASC` server-side; el cliente no depende del orden para funcionalidad.
- Riesgo: PK compuesta sin autoincrement confunde a Drizzle Kit → Mitigación: definir `primaryKey({ columns: [...] })` explícito en el schema (no dejar que Drizzle infiera).
- Riesgo: el catálogo público expone IDs internos → Mitigación: aceptable (no es PII); documentar en `/api/v1/catalog/*` que los IDs son públicos.