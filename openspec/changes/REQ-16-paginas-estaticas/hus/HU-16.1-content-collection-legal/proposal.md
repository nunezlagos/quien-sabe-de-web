# Propuesta — HU-16.1 — Content collection legal

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

Las páginas institucionales (about, terms, privacy, faq) deben poder editarse
sin redeploy de código. Astro Content Collections ofrece tipado fuerte de
frontmatter, validación Zod en build y `getEntry()` para lectura programática.
Sin esta capa, cualquier cambio de copy exige tocar el repo, abrir PR y esperar
CI. La colección se llamará `legal` y agrupará los 4 documentos bajo
`src/content/legal/`.

## Mockups de referencia

No aplica. HU 100% backend (config Astro + stubs Markdown). Las páginas que la
consumen se renderizan en HU-16.2/16.3/16.4/16.5; sus mockups de referencia
son `mockups/about.html`, `mockups/terms.html`, `mockups/privacy.html` y el
estilo de `mockups/verification.html` (cards blancas, primary `#2E8B57`) para
el FAQ.

## Alternativas consideradas

### Opcion A — Astro Content Collection `legal` con schema Zod
- Colección definida en `src/content/config.ts` con `defineCollection({ type:'content', schema: z.object({...}) })`.
- Archivos en `src/content/legal/{about,terms,privacy,faq}.md`.
- Pro: validación en build (typos de frontmatter rompen el build, no el runtime).
- Pro: API `getEntry("legal", "about")` y `getCollection("legal")` tipadas.
- Contra: requiere regenerar tipos Astro (`astro sync`) cuando se agrega un campo nuevo.

### Opcion B — Lectura manual de archivos con `fs` en cada request
- Helper `loadMarkdown(path)` que lee disco en runtime y parsea con `gray-matter`.
- Pro: cero config, sirve archivos sueltos sin estructura.
- Contra: sin validación de frontmatter (typos pasan al runtime).
- Contra: incompatible con SSR edge (no hay `fs` en Cloudflare Workers); exige bundling custom.

### Opcion C — CMS headless externo (Sanity, Contentful)
- Editor visual conectado vía API.
- Pro: flujo editorial cómodo para no-devs.
- Contra: costo, dependencia externa, latencia de fetch, contrato de PII con el vendor (relevante para REQ-22 / Ley 19.628).

## Decision

Se elige **Opcion A**. La validación en build previene typos antes de
producción, la API `getEntry` es 100 % tipada y no introduce dependencias ni
costos. Content Collection es la primitiva oficial de Astro para este caso y
el costo de `astro sync` es marginal. El CMS queda descartado por costo,
dependencia y por lo delicado de alojar copy legal en un tercero.

## Riesgos y mitigaciones

- Riesgo: devs olvidan correr `astro sync` tras cambiar schema → Mitigación: documentar en `README.md` y agregar check pre-commit.
- Riesgo: archivos Markdown sin frontmatter completo rompen el build → Mitigación: el schema Zod define todos los campos como requeridos; el build falla con mensaje claro.
- Riesgo: copy legal desactualizado → Mitigación: el campo `updated_at` es parte del frontmatter y la vista lo muestra; auditar en cada release.

## Metrica de exito

- `astro build` falla si cualquier `src/content/legal/*.md` no cumple el schema.
- `astro sync` regenera `src/content.d.ts` con tipos de la colección.
- `getEntry("legal", "about")` resuelve en build (SSG) sin runtime I/O.
- `tests/unit/content/legal-collection.test.ts` cubre casos válidos e inválidos.
