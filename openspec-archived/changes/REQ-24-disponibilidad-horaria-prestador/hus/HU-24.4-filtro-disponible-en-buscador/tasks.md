# HU-24.4 — Filtro available_now en /search

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-24-disponibilidad-horaria-prestador
**Rama:** `feat/HU-24.4-filtro-disponible-en-buscador`

## Tareas técnicas

- [ ] **T1** Extender validador `searchQuerySchema` en `src/lib/validators/search.ts` con campo `available_now: z.enum(['true']).optional()`.
- [ ] **T2** Servicio `src/lib/services/availability/search.ts` con `filterAvailableNow(env, baseQuery, now: Date)` que importa `getLocalHourAndDay` de HU-24.3 y agrega `EXISTS (SELECT 1 FROM provider_availability pa WHERE pa.provider_id = providers.id AND pa.day_of_week = ? AND pa.start_time <= ? AND ? < pa.end_time)`.
- [ ] **T3** Extender `src/pages/api/v1/search.ts` (REQ-06):
  - Parse con `searchQuerySchema` extendido.
  - Si `available_now === 'true'`, llamar `filterAvailableNow`.
  - Ordenar por `is_available_now DESC, rating DESC`.
- [ ] **T4** Extender UI hero `src/pages/index.astro`: agregar checkbox "Disponible ahora" entre el select comuna y el input keyword, con clases `rounded text-primary focus:ring-primary border-gray-300` y label `text-sm text-gray-700 font-semibold`. Listener JS que actualiza hidden input y permite submit al "Buscar".
- [ ] **T5** Empty state en `src/components/search/SearchResults.astro` (REQ-06): si array vacío y `available_now=true`, renderizar card `bg-yellow-50 border-yellow-200` con texto "No hay prestadores disponibles ahora" + botón "Ver todos los prestadores" que limpia el filtro.
- [ ] **T6] Tests:
  - [ ] `tests/unit/validators/search.test.ts` — schema acepta `?available_now=true`; rechaza `?available_now=yes`; rechaza `?available_now=1`.
  - [ ] `tests/integration/search/available-now.test.ts` — fixture: prestador 1 con lunes 09-13; prestador 2 con martes 10-15; prestador 3 sin availability. Mock Date lunes 10:00 Chile. `GET /search?available_now=true` devuelve sólo prestador 1. Combinado con `commune=Santiago&available_now=true` aplica intersección. EXPLAIN QUERY PLAN usa `idx_provider_availability_provider`. Mock Date martes 10:00 → devuelve prestador 2.
  - [ ] Sabotaje 1: en `filterAvailableNow`, olvidar el `?` en el bind del `end_time` (`pa.start_time <= ? AND pa.end_time < hhmm` en vez de `< hhmm` con bind) → siempre filtra como si fuera mediodía → test verifica que el prestador con rango 09-13 aparece a las 10:00 → restaurar.
  - [ ] Sabotaje 2: en el endpoint, no aplicar `filterAvailableNow` cuando `available_now=true` → devuelve todos los prestadores → test con mock lunes 22:00 espera array con prestador lunes 9-13 (NO disponible) y verifica que NO aparece → restaurar.
  - [ ] Sabotaje 3: en el empty state, no mostrar el CTA "Ver todos" → E2E verifica que el botón está presente cuando no hay resultados → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (toggle + búsqueda)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/availability/search.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: filtro available_now en buscador` y push a rama (no merge a main)