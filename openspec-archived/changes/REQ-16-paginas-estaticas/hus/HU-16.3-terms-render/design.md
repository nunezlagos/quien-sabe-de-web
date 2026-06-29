# Diseno tecnico — HU-16.3 — Renderizar /terms con version

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

### Tabla `legal_versions` (introducida por esta HU; HU-16.6 la explota)

```ts
// src/database/schema.ts (extracto nuevo)
export const legalVersions = sqliteTable('legal_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { enum: ['about', 'terms', 'privacy', 'faq'] }).notNull(),
  version: text('version').notNull(),         // ej: "v1", "v2"
  publishedAt: integer('published_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  // UNIQUE (slug, version) — declarado en la migración SQL
}));
```

### Migracion

`src/database/migrations/00XX_legal_versions.sql`:
- `CREATE TABLE legal_versions (...)`
- `CREATE UNIQUE INDEX idx_legal_versions_slug_version ON legal_versions(slug, version);`

## Contrato de API

No aplica. Página estática. El `INSERT` se ejecuta en el frontmatter de la
vista durante el build (no expone endpoint).

## Validaciones Zod

```ts
// src/lib/validators/legal.ts (firmas)
import { z } from 'zod';

export const legalSlugSchema = z.enum(['about', 'terms', 'privacy', 'faq']);
export const legalVersionSchema = z.string().regex(/^v\d+$/);

export const ensureLegalVersionInputSchema = z.object({
  slug: legalSlugSchema,
  version: legalVersionSchema,
});
```

`ensureLegalVersion` confía en que la entrada ya viene del frontmatter
validado por Zod del HU-16.1; el runtime Zod es defensa redundante.

## Componentes UI

- `src/pages/terms.astro` — usa `LegalLayout.astro` (creado en HU-16.2) y
  renderiza `<Content />` de `getEntry("legal","terms")`. Muestra además
  "Versión: vN" en el header de la card (slot `version`).

```astro
---
import { getEntry } from 'astro:content';
import LegalLayout from '../layouts/LegalLayout.astro';
import { ensureLegalVersion } from '../lib/services/legal-versions';

const entry = await getEntry('legal', 'terms');
if (!entry) throw new Error('Missing legal/terms.md');
const { Content } = await entry.render();

await ensureLegalVersion(Astro.locals.runtime.env.DB, {
  slug: 'terms',
  version: entry.data.version,
});
---
<LegalLayout title={entry.data.title} description={entry.data.description}>
  <Fragment slot="version">Versión: {entry.data.version}</Fragment>
  <Content />
</LegalLayout>
```

## Flujo de interaccion (secuencial)

1. Build Astro arranca.
2. `src/pages/terms.astro` ejecuta `getEntry("legal","terms")`.
3. `ensureLegalVersion` hace `INSERT OR IGNORE` (Drizzle: `.onConflictDoNothing({ target: [legalVersions.slug, legalVersions.version] })`).
4. Render del HTML con `<Content />` y el badge de versión.
5. En requests subsecuentes, la página ya está estática; el `INSERT` no se vuelve a correr.

## Capa de servicios

```ts
// src/lib/services/legal-versions.ts (firmas)
export type LegalVersionInsert = { slug: LegalSlug; version: string };

export async function ensureLegalVersion(
  db: Db,
  input: LegalVersionInsert,
): Promise<{ inserted: boolean; version: string }> {
  // INSERT ... ON CONFLICT (slug, version) DO NOTHING
  // retorna { inserted: true } si la fila es nueva
}
```

(La lógica de "última versión publicada por slug" la implementa HU-16.6;
HU-16.3 no la necesita.)

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/legal.test.ts` | `ensureLegalVersionInputSchema` rechaza slug o version inválidos |
| Integracion | `tests/integration/legal/versions.test.ts` | `ensureLegalVersion` inserta una vez; segunda llamada es no-op; UNIQUE constraint presente; índice presente |

## Dependencias y secuencia

- **Bloqueado por:** HU-16.1 (collection `legal`).
- **Co-bloqueado por:** HU-16.6 debe haber creado la tabla `legal_versions`. Si la migración aún no existe al implementar HU-16.3, agregar la tabla en una migración previa de esta HU (escenario soportado).
- **Bloquea a:** HU-16.6 (que lee la versión vigente desde `legal_versions`).
- **Recursos compartidos:** `src/database/schema.ts`, `src/lib/services/legal-versions.ts`.

## Riesgos tecnicos

- Riesgo: la migración `legal_versions` no está cuando HU-16.3 se implementa → Mitigación: la task T1 crea la migración en esta HU si HU-16.6 aún no la creó; coordinación en PR.
- Riesgo: `Astro.locals.runtime.env.DB` undefined en build SSG → Mitigación: detectar modo (`import.meta.env.PROD` o `Astro.locals.runtime === undefined`); si no hay runtime, hacer skip del `INSERT` y loguear warning. Tests integración cubren el path con Drizzle in-memory.
- Riesgo: el `INSERT` en build se ejecuta en cada deploy aunque la versión no haya cambiado → Mitigación: `ON CONFLICT DO NOTHING` lo convierte en no-op a nivel SQL.
