# Diseño técnico — HU-02.1 — Catálogo de comunas RM como seed

**REQ padre:** REQ-02-onboarding-vecino

## Modelo de datos

### Tabla Drizzle

```ts
// src/database/schema.ts (extracto)
export const communes = sqliteTable('communes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),                // "Las Condes"
  slug: text('slug').notNull().unique(),       // "las-condes"
  region: text('region').notNull(),            // "Metropolitana"
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull().default(sql`(unixepoch())`),
})
```

### Migración Drizzle

- Archivo: `src/database/migrations/0001_seed_communes.sql` (ya
  generado por el flujo actual de la rama `feat/HU-02.1-catalogo-comunas`).
- Contiene 52 `INSERT OR IGNORE INTO communes (name, slug, region) VALUES (...)`.
- `UNIQUE(slug)` garantiza idempotencia a nivel DDL.

### Limpieza previa

La rama ya eliminó la tabla `trades` (scaffold no presente en
openspec) del schema y de la migración `0000_init.sql`. Ningún código
de runtime la referencia.

## Contrato de API

| Endpoint | Método | Auth | Query | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/communes` | GET | público | `q?: string` (case-insensitive, busca por `name` con `LIKE %q%`) | `Array<{ id: number, name: string, slug: string, region: string }>` | 500 |

Sin paginación: el catálogo es de 52 filas y se cachea en KV en el
edge. Headers: `Cache-Control: public, max-age=3600`.

## Validaciones Zod

```ts
// src/lib/validators/communes.ts (pseudocódigo)
export const communesQuerySchema = z.object({
  q: z.string().min(1).max(120).optional(),
})
```

No se valida el cuerpo del seed (no hay endpoint de escritura; los
datos vienen de la migración).

## Componentes UI

No aplica en esta HU. Los consumidores (`/onboarding`, perfil del
prestador) montan su propio `<select>` y consumen el endpoint.

## Flujo de interacción (secuencial)

1. Dev aplica migración `0001_seed_communes.sql` vía
   `docker exec quien-sabe-app bun run db:migrate:local`.
2. La tabla queda con 52 filas. Smoke test:
   `curl http://localhost:4323/api/v1/communes` retorna JSON.
3. En SSR, el wizard `/onboarding` (HU-02.2) hace fetch al endpoint y
   puebla el `<select>`.
4. La búsqueda con `?q=` se hace en cliente mediante fetch con debounce
   250 ms (la FU del wizard).
5. La fila seleccionada pasa como `commune_id` al POST de
   `/api/v1/users/me/profile`.

## Capa de servicios

- `src/lib/services/communes.ts`
  - `listCommunes(db, q?: string): Promise<CommuneRow[]>` — query
    `SELECT id, name, slug, region FROM communes WHERE name LIKE ? OR ? ORDER BY name`.
  - `seedCommunes(db, communes: Array<{name, slug, region}>): Promise<void>` —
    usa `INSERT OR IGNORE` para garantizar idempotencia. Pensado para
    tests y para una eventual HU que sume más regiones.
- `src/lib/utils/slug.ts`
  - `slugify(input: string): string` — kebab-case, lowercase, opcional
    sin acentos. Reutilizado por seed y por futuras HU que requieran
    slugs humanos.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/communes/slug.test.ts` | Helper `slugify` con casos normales, acentos, mayúsculas, espacios múltiples, guiones duplicados. |
| Integración | `tests/integration/communes/list.test.ts` | `listCommunes` con D1 in-memory: vacío, 52 filas, búsqueda case-insensitive, búsqueda parcial, `q=""` retorna todas. |
| Integración | `tests/integration/communes/seed-idempotent.test.ts` | `seedCommunes` ejecutado 2 veces seguidas → siguen 52 filas (sin UNIQUE violation, sin conteo alterado). |
| Integración | `tests/integration/communes/endpoint.test.ts` | `GET /api/v1/communes` y `GET /api/v1/communes?q=las%20condes` retornan forma esperada. |
| E2E | `tests/e2e/onboarding-communes.spec.ts` | Wizard `/onboarding` carga el `<select>` con 52 opciones; seleccionar comuna + completar flujo → persiste `commune_id`. |

## Dependencias y secuencia

- **Bloqueado por:** ninguna (raíz de REQ-02; sólo depende de REQ-01
  por el binding D1 disponible tras la primera migración).
- **Bloquea a:** HU-02.2 (form-onboarding), HU-02.3 (preferencias),
  HU-04.x (perfil prestador requiere comuna), HU-21.x (wizard prestador).
- **Recursos compartidos:** `src/database/schema.ts`,
  `src/database/migrations/`, binding D1 `Astro.locals.runtime.env.DB`.

## Riesgos técnicos

- Riesgo: drizzle-kit no respeta el orden entre `0000_init.sql` y
  `0001_seed_communes.sql` → Mitigación: journal explícito y aplicación
  secuencial; si surge drift, regenerar con `bun run db:generate`.
- Riesgo: nombres acentuados mal codificados al generar slug →
  Mitigación: normalizar Unicode (`NFD` + remover diacríticos) en
  `slugify`; tests unitarios cubren "Ñuñoa" → "nunoa".
- Riesgo: campo `region` constante pero nullable en futuro
  (multi-región) → Mitigación: dejar `NOT NULL` por ahora; extender
  requiere nueva migración.