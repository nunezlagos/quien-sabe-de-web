# Diseno tecnico — HU-16.4 — /privacy cumpliendo Ley 19.628

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

No se introducen tablas. La fuente es `src/content/legal/privacy.md`. El
frontmatter declara `version: "v1"` para que HU-16.6 lo registre en
`legal_versions` (creada en HU-16.3).

## Contrato de API

No aplica.

## Validaciones Zod

El schema de la content collection (HU-16.1) ya exige `title`, `description`,
`version: /^v\d+$/`, `updated_at`. Adicionalmente, una validación opcional en
`src/lib/validators/privacy.ts` (no Zod, sino un helper `assertPrivacySections(body)`)
parsea el Markdown y exige las 6 secciones por regex de heading. Pensado
para correr en build via `astro check` custom o test integración que itera
sobre la collection.

```ts
// src/lib/validators/privacy.ts (firmas)
export const PRIVACY_SECTION_SLUGS = [
  'datos-recolectados',
  'finalidad',
  'conservacion',
  'derechos',
  'contacto',
] as const;

export function assertPrivacySections(body: string): void;
```

## Componentes UI

- `src/pages/privacy.astro` — usa `LegalLayout.astro`. Render de `<Content />`
  + slot `version`. Adicionalmente, expone los slugs de sección como un
  índice (toc) si el cuerpo los declara con `<a id="privacy-X"></a>`.
- Patrón de header con banner azul tomado de `mockups/privacy.html:28-37`,
  que se logra con `<header class="bg-primary ...">` dentro de
  `LegalLayout.astro` cuando el slot `hero` se usa. Privacy sí usa ese slot
  (las páginas `/terms` y `/about` no).

```astro
---
// src/pages/privacy.astro
import { getEntry } from 'astro:content';
import LegalLayout from '../layouts/LegalLayout.astro';
import { ensureLegalVersion } from '../lib/services/legal-versions';

const entry = await getEntry('legal', 'privacy');
if (!entry) throw new Error('Missing legal/privacy.md');
const { Content } = await entry.render();

if (Astro.locals.runtime?.env?.DB) {
  await ensureLegalVersion(Astro.locals.runtime.env.DB, {
    slug: 'privacy',
    version: entry.data.version,
  });
}
---
<LegalLayout title={entry.data.title} description={entry.data.description}>
  <Fragment slot="hero">
    <header class="bg-primary text-white py-16 text-center">
      <h1 class="text-3xl md:text-5xl font-extrabold">Política de Privacidad</h1>
      <p class="text-green-100 mt-2">Cumplimos con la Ley 19.628 de Chile.</p>
    </header>
  </Fragment>
  <Fragment slot="version">Versión: {entry.data.version}</Fragment>
  <Content />
</LegalLayout>
```

## Flujo de interaccion (secuencial)

1. Dev escribe `src/content/legal/privacy.md` con frontmatter y 6 secciones, cada una con `<a id="privacy-{slug}"></a>` antes del heading.
2. Build Astro parsea, valida y genera HTML.
3. Cada `<a id>` se preserva en el HTML; los headings `##` pasan a `<h2>` con su propio `id` autogenerado.
4. Visitante abre `/privacy`; navegador ancla a `#privacy-derechos` si el link lo usa.

## Capa de servicios

- Reutiliza `ensureLegalVersion` de HU-16.3.
- Helper `assertPrivacySections(body)` en `src/lib/validators/privacy.ts` (sin DB).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/privacy.test.ts` | `assertPrivacySections` acepta body con las 6 secciones; rechaza body sin "Derechos"; rechaza body sin email `privacidad@` |
| Integracion | `tests/integration/pages/privacy.test.ts` | `getEntry('legal','privacy')` resuelve; frontmatter completo; `assertPrivacySections(entry.body)` no lanza |
| E2E | `tests/e2e/privacy-ley-19628.spec.ts` | `GET /privacy` → 200, presencia de los 6 `id` esperados, email `privacidad@quien-sabe.cl` como `mailto:` |

## Dependencias y secuencia

- **Bloqueado por:** HU-16.1 (collection), HU-16.3 (`ensureLegalVersion` + tabla `legal_versions`).
- **Co-bloqueado por:** HU-16.2 (`LegalLayout.astro` con slot `hero`).
- **Bloquea a:** ninguno directo; alimenta a REQ-22 (compliance) que puede linkear a `/privacy` desde el dashboard de datos.
- **Recursos compartidos:** `src/content/legal/privacy.md`, `src/layouts/LegalLayout.astro`, `src/lib/validators/privacy.ts`.

## Riesgos tecnicos

- Riesgo: el plugin remark-slug de Astro no genera ids estables si los headings cambian de texto → Mitigación: usar `<a id="privacy-X">` explícitos controlados por el editor, no depender del slugify automático.
- Riesgo: copy incompleto por edición descuidada → Mitigación: `assertPrivacySections` corre en `astro check` custom (task T7) y en CI.
- Riesgo: la página linkea a `account-data.html` (mockup línea 132) que en Astro es `/account/data` → Mitigación: el editor del copy debe usar rutas internas Astro; documentar convención en `README.md`.
