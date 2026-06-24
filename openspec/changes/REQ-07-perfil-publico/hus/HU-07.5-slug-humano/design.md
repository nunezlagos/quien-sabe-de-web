# Diseno tecnico — HU-07.5 — Slug humano y redirect desde ?id=

**REQ padre:** REQ-07-perfil-publico

## Modelo de datos

Requiere migración que:

1. Agregue columna `slug TEXT` a `providers`.
2. Backfill: para cada provider existente, generar slug con `generateSlug(name, trade, commune)` + deduplicación.
3. Cree índice UNIQUE `UNIQUE(slug)`.

DDL (pseudo):

```sql
ALTER TABLE providers ADD COLUMN slug TEXT;

-- backfill (batched por seguridad, fuera del PR inmediato)
UPDATE providers SET slug = (
  SELECT generate_slug_human(name, trade, commune) -- implementado en TS, no SQL
) WHERE slug IS NULL;

CREATE UNIQUE INDEX idx_providers_slug ON providers(slug);
```

La generación de slug es TS, no SQL. Estrategia: un script Node standalone que abre D1, lee providers sin slug, genera slug en TS con `try/catch` UNIQUE, y persiste. Aplicar antes de crear el índice.

## Contrato de API

No añade endpoints nuevos. Cambia:

- `GET /api/v1/providers/:idOrSlug` (HU-07.1): ahora devuelve `slug: string` poblado (no `null` después de esta HU).
- `GET /profile?id=<n>` → nuevo handler `src/pages/profile.astro` que devuelve 301 al slug.

| Endpoint | Método | Auth | Query | Response | Errores |
|---|---|---|---|---|---|
| `/profile` | GET | público | `id` numérico | `301 Location: /p/<slug>` con `Cache-Control: public, max-age=86400` | 404 si provider no existe |

## Validaciones Zod

```ts
// src/lib/validators/providers.ts (extender)
export const generateSlugInputSchema = z.object({
  name: z.string().min(1).max(120),
  trade: z.string().min(1).max(80),
  commune: z.string().min(1).max(80),
});

export const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).min(3).max(200);
```

## Componentes UI

- `src/pages/profile.astro` — recibe `?id=` y hace 301 a `/p/<slug>`. Si no hay provider → 404 con página de error simple.

```astro
---
const id = Astro.url.searchParams.get('id');
if (!id || !/^\d+$/.test(id)) return Astro.redirect('/404', 404);
const provider = await getPublicProviderByIdOrSlug(Astro.locals.runtime.env, id);
if (!provider || !provider.slug) return new Response('not found', { status: 404 });
return Astro.redirect(`/p/${provider.slug}`, 301);
---
```

(Nota: `Astro.redirect` con 301 debe setearse explícitamente; por defecto es 302.)

## Flujo de interaccion (secuencial)

### Creación de prestador (no es esta HU pero la consume)

1. Endpoint existente `POST /api/v1/providers` (REQ-04).
2. Antes del INSERT, generar slug con `generateUniqueSlug(env, name, trade, commune)`.
3. INSERT con `slug`.

### Redirect desde `?id=`

1. Visitante llega a `/profile?id=42`.
2. Handler en `src/pages/profile.astro` busca el provider por id.
3. Si existe y tiene slug → 301 a `/p/<slug>` con `Cache-Control: public, max-age=86400`.
4. Si no existe → 404.

### Backfill

1. Script `scripts/backfill-provider-slugs.ts` lee providers sin slug, genera con `generateUniqueSlug`.
2. Aplica con `bun run scripts/backfill-provider-slugs.ts` antes del `CREATE UNIQUE INDEX`.
3. Crea el índice UNIQUE.

## Capa de servicios

- `src/lib/services/providers.ts` (extender):
  - `generateSlug(name, trade, commune): string` — usa `slugify` (existente) sobre cada parte, concatena con `-`.
  - `generateUniqueSlug(env, name, trade, commune): Promise<string>` — loop hasta `MAX_ATTEMPTS=10`: genera slug, intenta SELECT, si libre retorna, si no prueba `-2`, `-3`, etc.
- `scripts/backfill-provider-slugs.ts` — CLI de backfill (no se deploya, sólo dev/CI).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/slug.test.ts` (extender) | `generateSlug("Juan Pérez", "Gasfiter", "Las Condes") === "juan-perez-gasfiter-las-condes"`; con acentos → "gasfiter"; vacío → falla; oficios con espacios múltiples → colapsa |
| Unit | `tests/unit/services/providers.test.ts` | `generateUniqueSlug` con provider libre → primer slug; con colisión → `-2`; con 11 colisiones → lanza `MaxAttemptsError` |
| Unit | `tests/unit/validators/providers.test.ts` (extender) | `slugSchema` acepta kebab-case; rechaza mayúsculas, acentos, espacios, empieza con `-` |
| Integración | `tests/integration/providers/slug-redirect.test.ts` | seed provider con id=42 y slug="x"; `GET /profile?id=42` → 301 con `Location: /p/x`; `GET /profile?id=99999` → 404; backfill sobre 2 providers con mismo nombre → slugs distintos |

## Dependencias y secuencia

- **Bloqueado por:** HU-07.1 (DTO ya devuelve `slug`). REQ-04 (provider existente).
- **Bloquea a:** HU-07.6 (SEO usa `slug`).
- **Recursos compartidos:** `src/lib/utils/slug.ts` (existente), D1.

## Riesgos tecnicos

- Riesgo: la migración de backfill se aplica dos veces → Mitigación: el script es idempotente (sólo opera sobre `slug IS NULL`).
- Riesgo: índice UNIQUE sobre `slug` falla por duplicados pre-existentes → Mitigación: el script de backfill corre antes de crear el índice; abortar si quedan duplicados.
- Riesgo: redirect 301 cacheado por CDN a un slug que luego cambia → Mitigación: cambio de slug no soportado (documentado); si en el futuro se permite, usar 308 con invalidación explícita.
- Riesgo: `slugify` de "Las Condes" genera `las-condes` pero queremos `lascondes` o similar → Mitigación: aceptar la versión actual (`las-condes`); el helper ya normaliza.
