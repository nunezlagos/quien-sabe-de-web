# Diseno tecnico — HU-16.5 — FAQ con acordeón y búsqueda local

**REQ padre:** REQ-16-paginas-estaticas

## Modelo de datos

No se introducen tablas. La fuente es `src/content/legal/faq.md` con el
schema de HU-16.1. El cuerpo sigue una convención interna:

```md
## Categoría: General

<details>
<summary>¿Quién Sabe cobra comisión?</summary>

No, la plataforma es 100% gratuita.
</details>

<details>
<summary>¿Cómo contacto a un prestador?</summary>

Desde su perfil público, vía WhatsApp o email.
</details>
```

El parser `parseFaq(body)` (no en runtime, solo en build/tests) itera
`<details>` y construye un array `{ question, answer }[]` para tests.

## Contrato de API

No aplica.

## Validaciones Zod

```ts
// src/lib/validators/faq.ts (firmas)
import { z } from 'zod';

export const faqEntrySchema = z.object({
  question: z.string().min(5).max(280),
  answer: z.string().min(1).max(2000),
});

export const faqDocumentSchema = z.object({
  entries: z.array(faqEntrySchema).min(1),
});

export function parseFaq(body: string): FaqEntry[];
```

`parseFaq` corre en build (o en `astro check` custom) y rechaza archivos
con 0 entradas.

## Componentes UI

- `src/components/faq/Accordion.astro` — wrapper que toma `entries[]` y
  renderiza un `<input role="search">` + un `<div id="faq-list">` con cada
  `<details>` marcado con `data-faq-entry` y `data-search` (contenido
  normalizado para filtro). Más un `<p id="faq-empty" hidden>Sin
  resultados</p>` al final.
- `src/components/faq/AccordionFilter.astro` — `<script>` inline (~15
  líneas) que:
  1. Escucha `input` en el search.
  2. Normaliza la query (`NFD` + lowercase + sin diacriticos).
  3. Para cada `<details>`, togglea `hidden` si `data-search.includes(query)`.
  4. Si ninguna entry visible, muestra `#faq-empty`.
- `src/pages/faq.astro` — usa `LegalLayout`, llama `getEntry("legal","faq")`,
  parsea body, pasa entries al componente.

```astro
---
// src/pages/faq.astro
import { getEntry } from 'astro:content';
import LegalLayout from '../layouts/LegalLayout.astro';
import Accordion from '../components/faq/Accordion.astro';
import { parseFaq } from '../lib/validators/faq';

const entry = await getEntry('legal', 'faq');
if (!entry) throw new Error('Missing legal/faq.md');
const entries = parseFaq(entry.body);
---
<LegalLayout title={entry.data.title} description={entry.data.description}>
  <Fragment slot="version">Versión: {entry.data.version}</Fragment>
  <Accordion entries={entries} />
</LegalLayout>
```

## Flujo de interaccion (secuencial)

1. Visitante abre `/faq`.
2. Ve input búsqueda + lista de `<details>` colapsados.
3. Tipea "reseña" → script filtra: sólo `<details>` cuyo `data-search`
   contenga "reseña" quedan visibles (sin `hidden`).
4. Click en un `<summary>` → `<details>` se expande nativamente; respuesta visible.
5. Si query no matchea nada, aparece el mensaje "Sin resultados".

## Capa de servicios

- `src/lib/validators/faq.ts` — `parseFaq(body)`, normalización de texto,
  schema Zod. Sin DB, sin I/O.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/faq.test.ts` | `parseFaq` extrae entries de Markdown con `<details>`; rechaza body sin entries; normaliza acentos al construir `data-search` |
| Unit | `tests/unit/components/accordion.test.ts` | el componente renderiza N `<details>`; el script inline está presente y referencia `#faq-list` y `#faq-empty` |
| E2E | `tests/e2e/faq.spec.ts` | `GET /faq` → 200, 5+ entries colapsados, click expande, búsqueda filtra, query sin match muestra `#faq-empty` |

## Dependencias y secuencia

- **Bloqueado por:** HU-16.1 (collection), HU-16.2 (LegalLayout).
- **Bloquea a:** ninguno.
- **Recursos compartidos:** `src/content/legal/faq.md`, `src/layouts/LegalLayout.astro`.

## Riesgos tecnicos

- Riesgo: el Markdown no preserva `<details>` por algún quirk de remark → Mitigación: usar `remarkRehype` con `allowDangerousHtml: true` o `MDX` para que la etiqueta pase tal cual. Decidir en T1.
- Riesgo: el script inline se duplica si se importa la página en varios lugares → Mitigación: el `<script>` dentro de `Accordion.astro` usa el bundler de Astro (`<script>` se deduplica y hoistea una vez por build).
- Riesgo: el FAQ se vuelve enorme y el filtrado se siente lento → Mitigación: precomputar `data-search` normalizado en build; con 50-100 entries el filtro es instantáneo. Si crece, considerar Fuse.js (decisión futura).
