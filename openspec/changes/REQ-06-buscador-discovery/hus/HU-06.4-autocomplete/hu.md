# HU-06.4 — Autocompletado de oficios y comunas

**Estado:** implementada-mvp | **Prioridad:** P1 | **REQ padre:** REQ-06-buscador-discovery

## Historia de usuario

**Como** vecino tipeando en el buscador
**Quiero** ver sugerencias de oficios y comunas mientras escribo
**Para** completar la búsqueda con menos errores

## Criterios de aceptación (Gherkin)

### Escenario: Autocompletado oficios
  Cuando envío `GET /api/v1/search/autocomplete?q=gas&kind=trade`
  Entonces recibo `[{slug:"gasfiter", name:"Gasfíter"}, {slug:"gasista", name:"Gasista"}]`

### Escenario: Autocompletado comunas
  Cuando envío `GET /api/v1/search/autocomplete?q=ñu&kind=commune`
  Entonces recibo `[{slug:"nunoa", name:"Ñuñoa"}]`

### Escenario: Query muy corta → vacío
  Cuando envío `q=a`
  Entonces recibo `[]` (mínimo 2 caracteres)

### Escenario: Búsqueda accent-insensitive
  Cuando envío `q=nunoa` o `q=Ñuñoa`
  Entonces ambos devuelven la comuna `Ñuñoa`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/search/autocomplete.ts`
- [ ] Helper `normalizeAccents(s)` en `src/lib/utils/text.ts`
- [ ] Cache edge 60 s para queries calientes
- [ ] Tests `tests/unit/utils/text.test.ts`, `tests/integration/search/autocomplete.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
