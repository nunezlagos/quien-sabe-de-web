# HU-16.5 — FAQ con acordeón y búsqueda local

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-16-paginas-estaticas

## Historia de usuario

**Como** visitante
**Quiero** buscar y abrir respuestas a preguntas frecuentes
**Para** resolver dudas sin contactar soporte

## Criterios de aceptación (Gherkin)

### Escenario: Renderiza FAQs con acordeón
  Dado `faq.md` con 5 preguntas
  Cuando solicito `/faq`
  Entonces ve 5 items colapsados
  Y al hacer click se expande la respuesta

### Escenario: Búsqueda local filtra preguntas
  Cuando tipeo "reseña" en el input
  Entonces sólo quedan visibles las preguntas con esa palabra

### Escenario: Sin matches muestra mensaje
  Cuando tipeo "xyzabc"
  Entonces se muestra "Sin resultados"

## Tareas técnicas

- [ ] Vista `src/pages/faq.astro`
- [ ] Componente `src/components/faq/Accordion.astro` con script cliente
- [ ] Tests `tests/e2e/faq.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
