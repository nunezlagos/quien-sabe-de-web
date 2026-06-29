# HU-16.5 — FAQ con acordeón y búsqueda local

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-16-paginas-estaticas
**Rama:** `feat/HU-16.5-faq-acordeon`

## Tareas tecnicas

- [ ] **T1** Crear `src/content/legal/faq.md` con frontmatter completo y 6 entradas siguiendo la convención `<details><summary>pregunta</summary>respuesta</details>`. Al menos 2 categorías (`## General`, `## Verificación`).
- [ ] **T2** `parseFaq(body)` en `src/lib/validators/faq.ts` que extrae `{ question, answer }[]` de los `<details>`, valida con Zod, retorna array; lanza si no hay entries.
- [ ] **T3** Helper `normalizeForSearch(text)` que aplica `NFD`, remueve diacríticos, lowercase. Usado por `parseFaq` para construir el campo `search_blob` de cada entry.
- [ ] **T4** Componente `src/components/faq/Accordion.astro` que recibe `entries: FaqEntry[]` y renderiza input `role="search"` + `<details data-faq-entry data-search="...">` por entry + `<p id="faq-empty" hidden>Sin resultados</p>`. Acepta prop `placeholder` para el input.
- [ ] **T5** Componente `src/components/faq/AccordionFilter.astro` (o `<script>` inline dentro de `Accordion.astro`) que escucha el input, normaliza query, togglea `hidden` por entry, y muestra `#faq-empty` cuando ninguna coincide.
- [ ] **T6** Verificar el paso de `<details>` HTML: si remark lo sanitiza, cambiar `src/content/legal/faq.md` a `.mdx` o habilitar `allowDangerousHtml` en la config de la collection.
- [ ] **T7** `src/pages/faq.astro` con `getEntry('legal','faq')`, `parseFaq`, render `<Accordion>` dentro de `<LegalLayout>`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/validators/faq.test.ts` — `parseFaq` extrae 6 entries de un body real; rechaza body sin `<details>`; normaliza acentos ("verificacion" matchea "verificación"); respeta min 1 entry.
  - [ ] `tests/unit/components/accordion.test.ts` — renderiza N `<details>`; el script inline está en el bundle; `#faq-empty` existe y arranca con `hidden`.
  - [ ] `tests/e2e/faq.spec.ts` — `page.goto('/faq')` → 200, 6+ entries colapsados; click expande y muestra la respuesta; tipear "reseña" filtra; tipear "xyzabc" muestra `#faq-empty`.
- [ ] **T9** Verificar accesibilidad: input tiene `<label>` (visible o `aria-label`), `<details>` tienen `aria-controls` opcional, y el contenedor tiene role implícito.

## Sabotajes a confirmar

1. Cambiar `<details>` por `<div class="faq-item">` en `faq.md` → `parseFaq` retorna array vacío → test unitario rojo (Zod `min(1)` falla) → restaurar.
2. En `Accordion.astro`, eliminar el `<p id="faq-empty">` → test E2E que espera que aparezca al no haber match falla → restaurar.
3. Romper la normalización de acentos (`return text.toLowerCase()` sin NFD) → test unitario que tipea "verificacion" sin tilde y espera match con "verificación" falla → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run tests/unit/validators/faq.test.ts tests/unit/components/accordion.test.ts` → verde
- [ ] Tests E2E `bunx playwright test tests/e2e/faq.spec.ts` → verde
- [ ] Sabotaje 1 confirmado: `<details>` reemplazado → test rojo → restaurar
- [ ] Sabotaje 2 confirmado: `#faq-empty` removido → test E2E rojo → restaurar
- [ ] Sabotaje 3 confirmado: sin normalización → test rojo → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/validators/faq.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde
- [ ] Commit `feat: /faq con acordeón y búsqueda local` y push a rama (no merge a main)
