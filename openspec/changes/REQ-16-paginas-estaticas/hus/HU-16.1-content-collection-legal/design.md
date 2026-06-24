# Diseno tecnico — HU-16.1 — Content collection legal

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

### Schema Zod de la coleccion

```ts
// src/content/config.ts (extracto)
import { defineCollection, z } from 'astro:content';

const legal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    version: z.string().regex(/^v\d+$/),         // ej: "v1", "v2"
    updated_at: z.coerce.date(),
    slug: z.enum(['about', 'terms', 'privacy', 'faq']).optional(),
  }),
});

export const collections = { legal };
```

### Estructura de archivos

```
src/content/
  config.ts
  legal/
    about.md
    terms.md
    privacy.md
    faq.md
```

Cada Markdown declara frontmatter obligatorio; Astro genera `id = filename`
(`.md` se omite). El `slug` opcional permite URIs custom (no usado en HU-16.1).

### Tipos generados

`src/content.d.ts` (regenerado por `astro sync`):
```ts
declare namespace App {
  interface CollectionEntry<'legal'> { ... }
}
```

## Contrato de API

No aplica. HU 100% infraestructura Astro. Las páginas consumidoras (HU-16.2+)
leen la colección en build (SSG) o `await getEntry()` en SSR.

## Validaciones Zod

Las del schema arriba son el contrato. Adicionalmente el parser rechaza:

- `version` que no matchee `^v\d+$` (ej: "1.0", "v1.0.0" → inválido en HU-16.1;
  el relajamiento para semver se discute en HU-16.6).
- `updated_at` no parseable como `Date`.
- `title` o `description` vacíos.

## Componentes UI

No aplica. Las páginas se renderizan en HU-16.2, HU-16.3, HU-16.4 y HU-16.5.

## Flujo de interaccion (secuencial)

1. Crear `src/content/config.ts` con schema Zod y export de la colección `legal`.
2. Crear los 4 archivos `.md` con frontmatter mínimo (title, description, version, updated_at).
3. Correr `docker exec quien-sabe-app bunx astro sync` → genera `src/content.d.ts`.
4. `docker exec quien-sabe-app bunx astro check` → valida que los 4 archivos cumplan el schema.
5. Tests unitarios importan `getCollection` mockeada para ejercitar casos válidos e inválidos.

## Capa de servicios

No aplica. La capa de servicios que opera sobre `legal_versions` para tracking
de re-aceptación vive en HU-16.6.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/content/legal-collection.test.ts` | schema acepta frontmatter válido, rechaza faltante, rechaza `version` inválida, parsea `updated_at` |
| Build | `astro check` en CI | 4 archivos válidos compilan; archivo sin `title` rompe el build |

## Dependencias y secuencia

- **Bloqueado por:** —
- **Bloquea a:** HU-16.2, HU-16.3, HU-16.4, HU-16.5, HU-16.6.
- **Recursos compartidos:** `src/content/config.ts`, `src/content/legal/`.

## Riesgos tecnicos

- Riesgo: `astro sync` se olvida tras tocar schema → Mitigación: hook pre-commit `bunx astro check` o ejecutar en CI antes de tests.
- Riesgo: copy muy largo infla el bundle SSG → Mitigación: la colección se lee en build, no en runtime; el tamaño solo impacta el HTML estático generado.
- Riesgo: el parser Markdown (remark) no soporta directivas custom que el equipo quiera usar → Mitigación: documentar las directivas permitidas; custom plugins se agregan en HU aparte si surge la necesidad.
