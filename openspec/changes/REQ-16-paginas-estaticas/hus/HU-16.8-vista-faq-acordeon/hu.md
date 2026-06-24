# HU-16.8 — Vista `/faq` con acordeón de preguntas frecuentes

**Estado:** planificada | **Prioridad:** P2 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante o usuario nuevo
**Quiero** una página `/faq` con las preguntas más frecuentes en formato acordeón
**Para** resolver dudas rápidas sin tener que contactarme con soporte

## Contexto

REQ-16 menciona `/faq` en su lista de páginas estáticas pero no hay HU
específica. Esta HU la crea.

## Mockup de referencia

- `mockups/faq.html` (a crear en esta HU) — vista con:
  - Hero "Preguntas frecuentes"
  - Buscador en la parte superior (input + filtro por categoría)
  - Acordeón con ~10-15 preguntas agrupadas por categoría:
    - **General** (3-4 preguntas): qué es QuiénSabe, es gratis, cómo me registro
    - **Para vecinos** (3-4 preguntas): cómo busco, cómo contacto, cómo califico
    - **Para prestadores** (3-4 preguntas): cómo me registro como PRO, verificación, comisiones
    - **Donaciones y transparencia** (2-3 preguntas): para qué donamos, cómo se usan los fondos
  - Link "¿No encontraste tu respuesta? Escríbenos" → `mailto:soporte@quiensabe.cl`

## Criterios de aceptación (Gherkin)

### Escenario: GET /faq carga todas las preguntas
  Cuando visito `GET /faq`
  Entonces recibo status 200
  Y veo al menos 10 preguntas agrupadas en 4 categorías

### Escenario: Click expande una pregunta
  Cuando hago click en una pregunta cerrada
  Entonces se expande mostrando la respuesta
  Y la flecha rota 180°
  Y `aria-expanded="true"` se setea

### Escenario: Click colapsa una pregunta abierta
  Dado una pregunta abierta
  Cuando hago click de nuevo
  Entonces se colapsa

### Escenario: Búsqueda filtra preguntas en tiempo real
  Cuando tipeo "donar" en el input
  Entonces solo se muestran las preguntas que contienen "donar" en su título o respuesta
  Y las categorías sin matches se ocultan

### Escenario: Sin matches muestra mensaje
  Cuando tipeo algo que no matchea ninguna pregunta
  Entonces se muestra "No encontramos preguntas para tu búsqueda"

## Tareas técnicas

- [ ] Mockup `mockups/faq.html` con datos estáticos hardcodeados
- [ ] Vista `src/pages/faq.astro` que carga `src/lib/data/faq.ts` (array estático de preguntas)
- [ ] Componente `src/components/layout/FaqAccordion.astro` con `<details>`/`<summary>` HTML nativo (sin JS para expandir/colapsar)
- [ ] Componente `src/components/layout/FaqSearch.astro` con input + lógica de filtrado en `src/lib/client/faq/search.ts` (R2)
- [ ] Reusar `StaticPageHero` (creado en HU-16.7)
- [ ] Datos estáticos `src/lib/data/faq.ts` con 10-15 preguntas estructuradas
- [ ] Sin `style="..."` inline (R1)
- [ ] Tests E2E `tests/e2e/faq-page.spec.ts`:
  - Carga `/faq` → 200, contenido completo
  - Click expande/colapsa pregunta
  - Búsqueda filtra correctamente

## Definition of done

- [ ] Mockup revisado
- [ ] Tests E2E pasan
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] JS de búsqueda extraído a `.ts` aparte
- [ ] `StaticPageHero` reusado de HU-16.7
- [ ] PR mergeado a `develop`

## Riesgos / notas

- Las preguntas del FAQ deben estar en `src/lib/data/faq.ts` para que el equipo de contenido pueda editarlas sin tocar componentes.
- Si más adelante se necesita FAQ dinámica (admin edita desde panel), convertir este set a tabla D1 + endpoint GET, manteniendo la misma UI.