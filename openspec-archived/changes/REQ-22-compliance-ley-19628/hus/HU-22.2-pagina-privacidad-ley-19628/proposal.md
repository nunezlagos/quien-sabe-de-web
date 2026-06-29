# Propuesta — HU-22.2 — Página /privacy cubriendo Ley 19.628

**Estado:** propuesta | **REQ padre:** REQ-22-compliance-ley-19628

## Contexto

La Ley 19.628 artículos 12 y 13 obliga a informar al titular sobre qué datos se recolectan, con qué finalidad, quién es el responsable, qué derechos le asisten (ARCO+P: Acceso, Rectificación, Cancelación, Oposición, Portabilidad) y el plazo de conservación. La plataforma necesita una página `/privacy` accesible desde cualquier footer que documente estos puntos con lenguaje claro. Esta HU es 100% contenido + layout, sin lógica backend.

## Mockups de referencia

- `mockups/terms.html:40-69` — layout idéntico al requerido: `container mx-auto px-4 py-12 max-w-4xl`, card `bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100`, headings `text-2xl font-extrabold` para h1 y `text-xl font-bold` para h2, párrafos `text-gray-600 leading-relaxed`.
- `mockups/dashboard-user.html:135-139` — footer donde se debe insertar el link "Privacidad" entre "Términos" y "Transparencia".

## Alternativas consideradas

### Opción A — Contenido en `src/content/legal/privacy.md` (Markdown estático) + vista Astro
- Markdown cargado con `import privacy from '@/content/legal/privacy.md?raw'` o via Astro Content Collections (más limpio).
- Astro page `src/pages/privacy.astro` parsea el markdown a HTML.
- Pro: copywriters pueden editar el `.md` sin tocar código; revisión legal tiene un archivo plano.
- Pro: time-to-market mínimo.
- Contra: requiere flujo de revisión legal externa (abogado) antes de mergear; documentar.

### Opción B — HTML hardcodeado en la página Astro
- Pro: cero dependencias Markdown.
- Contra: el copy queda atado al archivo `.astro`; mezcla legal y técnico.

### Opción C — Generar PDF y linkear
- Pro: archivo descargable para audit.
- Contra: mala UX web; el usuario espera leer en el browser.

## Decisión

Se elige **Opción A**. Markdown en `src/content/legal/privacy.md` revisado por abogado, renderizado por la vista Astro. Permite iterar el copy sin PRs técnicos.

## Riesgos y mitigaciones

- Riesgo: el contenido no pasa por revisión legal → Mitigación: el PR de esta HU requiere aprobacion explícita del DPO (puede ser el mismo dev senior en este proyecto). El `.md` lleva un header `<!-- Reviewed: pending -->` que debe cambiarse a `<!-- Reviewed: 2026-XX-XX by NAME -->` antes del merge a main.
- Riesgo: el texto legal queda desactualizado → Mitigación: header con `Última actualización: YYYY-MM-DD` visible al pie, mismo patrón que `mockups/terms.html:67`.
- Riesgo: secciones requeridas no se incluyen → Mitigación: tests E2E Playwright que verifican presencia de las 7 secciones obligatorias (Datos recolectados, Finalidades, Responsable, Derechos ARCO+P, Plazo, Transferencias, Contacto DPO).

## Métrica de éxito

- `GET /privacy` devuelve 200.
- HTML contiene las 7 secciones con sus headings h2.
- Footer de cualquier página expone link `/privacy` entre "Términos" y "Transparencia".
- Sabotaje: eliminar la sección "Derechos ARCO+P" del markdown → E2E falla al no encontrar el heading → restaurar.