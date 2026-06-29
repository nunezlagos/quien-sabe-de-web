# Propuesta — HU-16.5 — FAQ con acordeón y búsqueda local

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

El FAQ debe permitir a un visitante resolver dudas sin contactar soporte.
Necesitamos una página `/faq` con (a) lista de preguntas que se expande al
hacer click, (b) un input de búsqueda local que filtra por palabra en
pregunta o respuesta y (c) un estado "Sin resultados" cuando nada matchea.
No hay mockup dedicado; el estilo se hereda de `mockups/verification.html`
(card blanca con sombras suaves, primary `#2E8B57`, secciones colapsables
estilo `<details>` de HTML5 nativas para evitar JS de más).

## Mockups de referencia

- `mockups/verification.html:78-128` — card blanca, sections colapsables,
  patrón de `rounded-3xl shadow-sm border border-gray-100` reutilizable.
- `mockups/reset-password.html:52-68` — patrón de "Requisitos" en lista con
  check/close (reutilizable para "Sin resultados").

## Alternativas consideradas

### Opcion A — `<details>` HTML5 nativos + script mínimo de filtro
- Cada pregunta es un `<details><summary>pregunta</summary>respuesta</details>`.
- Búsqueda local con un `<script>` que togglea `hidden` según match en `summary.textContent + respuesta`.
- Pro: accesible por default, funciona sin JS (solo se pierde la búsqueda instantánea).
- Pro: cero dependencias.
- Contra: el "Sin resultados" requiere un mensaje placeholder DOM que el script controla.

### Opcion B — Componente React/Vue con estado
- Componente cliente con useState, animación slide.
- Pro: animaciones más pulidas.
- Contra: bundle extra; team actualmente no usa React; en REQ-16 preferimos mantener cero JS de cliente donde sea posible.

### Opcion C — Generar acordeón con Stimulus (proyecto Laravel-like)
- No aplica al stack (Astro + Cloudflare Workers, sin Stimulus).

## Decision

Se elige **Opcion A**. `<details>` es accesible, progresivo, y el filtro es
un script inline de ~15 líneas. El FAQ vive en `src/content/legal/faq.md` con
frontmatter `version: "v1"`, y la página lo lee con `getEntry("legal","faq")`
+ `entry.render()`.

El formato del body del FAQ se acuerda como headings `##` para categoría y
listas con `**P:** pregunta` y `**R:** respuesta`, para que el script de
filtro pueda parsear de forma estable.

## Riesgos y mitigaciones

- Riesgo: el script de filtro rompe la accesibilidad si oculta contenido sin actualizar aria → Mitigación: el script setea `aria-hidden` en los `<details>` que no matchean, y el `<input role="search">` tiene `aria-controls` apuntando al contenedor.
- Riesgo: contenido del FAQ se vuelve obsoleto → Mitigación: la página expone "Última actualización" del frontmatter; auditar triméstralmente.
- Riesgo: el filtrado es case-sensitive o no maneja acentos → Mitigación: normalizar con `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()` antes de comparar.

## Metrica de exito

- `GET /faq` → 200, lista con al menos 5 preguntas, todas con `<details>` colapsado inicialmente.
- Input de búsqueda filtra en tiempo real; estado "Sin resultados" aparece con query `xyzabc`.
- Test E2E Playwright verifica click → expand, búsqueda → filtro, no match → mensaje.
