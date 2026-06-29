# Diseno tecnico — HU-16.2 — Renderizar /about

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

No se introducen tablas. La fuente es `src/content/legal/about.md` con el
schema definido en HU-16.1.

## Contrato de API

No aplica. Página estática.

## Validaciones Zod

No aplica. La validación ocurre en build via el schema de la content
collection. El render puro no añade reglas.

## Componentes UI

- `src/layouts/LegalLayout.astro` — layout reusable para todas las páginas
  de la colección `legal`. Slots: `<slot name="hero">` opcional + `<slot>`
  default con el contenido Markdown renderizado. Slots comunes:
  - `<slot name="updatedAt">` con la fecha formateada.
  - `<slot name="footer-extra">` para CTAs extra (no usado en /about).
  - Aplica `BaseLayout.astro` por debajo, así que hereda navbar y footer
    globales (links a /, /donations, etc.).
- `src/pages/about.astro` — delgada; resuelve la entry, la pasa a
  `<LegalLayout>` y renderiza `<Content />` dentro.

```astro
---
// src/pages/about.astro
import { getEntry } from 'astro:content';
import LegalLayout from '../layouts/LegalLayout.astro';

const entry = await getEntry('legal', 'about');
if (!entry) throw new Error('Missing legal/about.md');
const { Content } = await entry.render();

const dateFmt = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' });
const updatedAt = dateFmt.format(entry.data.updated_at);
---
<LegalLayout title={entry.data.title} description={entry.data.description}>
  <Content />
  <Fragment slot="updatedAt">Última actualización: {updatedAt}</Fragment>
</LegalLayout>
```

## Flujo de interaccion (secuencial)

1. Dev edita `src/content/legal/about.md` (cambia copy + bump `updated_at`).
2. PR → CI corre `astro check` + `astro build`.
3. Build genera el HTML estático de `/about`.
4. Deploy a Cloudflare Pages; el HTML queda cacheado en el edge.
5. Visitante abre `/about` → recibe HTML estático con hero + secciones + pie.

## Capa de servicios

No aplica.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/layouts/legal-layout.test.ts` | renderiza slot default + slot `updatedAt`; aplica clases del `BaseLayout` |
| Integracion | `tests/integration/pages/about.test.ts` | `getEntry('legal','about')` resuelve; frontmatter completo |
| E2E | `tests/e2e/about-page.spec.ts` | `GET /about` → 200, `<h1>` con title, footer con fecha |

## Dependencias y secuencia

- **Bloqueado por:** HU-16.1 (la collection `legal` debe existir).
- **Bloquea a:** ninguno.
- **Recursos compartidos:** `src/content/legal/about.md`, `src/layouts/LegalLayout.astro`.

## Riesgos tecnicos

- Riesgo: `entry.render()` falla si el Markdown tiene sintaxis inválida → Mitigación: `astro check` valida el parseo en CI; el build fallaría antes del deploy.
- Riesgo: fecha mal localizada (`es-CL` no soportado en runtime) → Mitigación: usar `Intl.DateTimeFormat` con fallback `'es'`; test cubre el formato esperado.
- Riesgo: layout `LegalLayout` divergente entre páginas → Mitigación: todos los consumidores (HU-16.2/16.3/16.4/16.5) usan el mismo layout; tests de regresión visual en CI.
