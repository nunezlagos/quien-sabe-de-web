# Propuesta — HU-16.4 — /privacy cumpliendo Ley 19.628

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

Chile protege datos personales vía Ley 19.628. La página `/privacy` debe
listar, en secciones explícitas, los datos que recolectamos, la finalidad, la
conservación, los derechos del titular (ARCO + P: Acceso, Rectificación,
Supresión, Portabilidad) y un canal de contacto del responsable
(`privacidad@quien-sabe.cl`). El mockup `mockups/privacy.html:39-152` ya
define la estructura: 6 secciones con cards blancas, íconos y un email
visible. Esta HU traduce el copy del mockup a Markdown y verifica que el
HTML final mantenga los identificadores (`id` por sección) para que tests
E2E y screenreaders puedan anclar.

## Mockups de referencia

- `mockups/privacy.html:39-152` — 6 secciones con cards blancas, íconos de
  Remix, banner azul de aviso legal en header y email de contacto en sección 6.
- `mockups/verification.html:42-48` — patrón de banner "Tu privacidad importa" reusable.

## Alternativas consideradas

### Opcion A — Markdown con anclas explícitas por sección
- Cada sección en `privacy.md` lleva un heading `## N. ...` y un `<a id="privacy-{slug}">` o se confía en el slugify automático de Astro.
- Pro: anclas estables para tests E2E (`page.locator('#privacy-derechos')`).
- Pro: editor no necesita aprender directivas custom.
- Contra: si el copy cambia, los slugs de heading pueden cambiar; mitigar con tests que asertean las 6 secciones por orden y por prefijo de id estable.

### Opcion B — Componentes Astro `<PrivacySection>` por bloque
- Reutilizar un componente React/Astro con props `title`, `icon`, `body`.
- Pro: consistencia visual perfecta entre secciones.
- Contra: copy se fragmenta entre múltiples archivos, complica edición y traducción.

### Opcion C — HTML estático pegado en `.astro` sin pasar por content collection
- Pegar el HTML del mockup directamente en `src/pages/privacy.astro`.
- Pro: 0 trabajo de conversión.
- Contra: rompe el contrato de HU-16.1 (todo el legal sale de `src/content/legal/`), pierde validación Zod, no permite HU-16.6 re-aceptación basada en frontmatter versionado.

## Decision

Se elige **Opcion A**. Mantener el legal como Markdown en la content
collection es el contrato del REQ. Para que las anclas sean estables,
asignar `id` explícito por sección vía shortcode Markdown o convención
`<a id="privacy-X"></a>` antes del heading, y asertar presencia en tests E2E.

## Riesgos y mitigaciones

- Riesgo: reforma 2026 de la Ley 19.628 cambia requisitos → Mitigación: el campo `version` en frontmatter permite versionar; HU-16.6 gatilla re-aceptación.
- Riesgo: la página omite una sección obligatoria (e.g. "Conservación") → Mitigación: test E2E falla si falta alguna de las 6 secciones por id estable.
- Riesgo: el email `privacidad@quien-sabe.cl` no está configurado para recibir → Mitigación: fuera del scope de esta HU; operación de mail routing se coordina aparte.

## Metrica de exito

- `GET /privacy` → 200, HTML contiene las 6 secciones esperadas: `Datos recolectados`, `Finalidad`, `Conservación`, `Derechos del titular (ARCO+P)`, `Contacto del responsable`.
- Email `privacidad@quien-sabe.cl` visible como `<a href="mailto:">`.
- Pie con "Versión: v1" y "Última actualización".
- Test E2E Playwright aserta cada sección por id estable.
