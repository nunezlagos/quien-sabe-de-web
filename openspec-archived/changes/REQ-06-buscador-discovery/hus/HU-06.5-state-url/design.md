# Diseno tecnico — HU-06.5 — Estado del buscador sincronizado con URL

**REQ padre:** REQ-06-buscador-discovery

## Modelo de datos

No aplica.

## Contrato de API

No agrega endpoints. Consume los existentes (`/api/v1/search`,
`/api/v1/search/autocomplete`).

## Validaciones Zod

Reusa `searchParamsSchema` de HU-06.1/HU-06.2. Helper de parse:

```ts
// src/lib/utils/searchUrl.ts
export function parseSearchParams(searchParams: URLSearchParams): SearchParams
export function serializeSearchParams(params: SearchParams): URLSearchParams
```

Mapeo corto: `trade → t`, `commune → c`, `min_rating → r`, `verified_only → v`, `cursor → p` (page), `limit → l`, `sort → s`.

## Componentes UI

- `src/pages/search.astro` — página de resultados. SSR lee `Astro.url.searchParams`, los pasa a `<SearchResults />`.
- `src/components/search/SearchResults.astro` — contenedor que recibe filtros y muestra items.
- `src/components/search/useSearchState.ts` — hook cliente (TS, no Astro) que:
  - Lee estado inicial de `window.location.search`.
  - `setFilters(newFilters)` actualiza estado + `history.pushState(null, '', '?' + serializeSearchParams(newFilters))`.
  - Escucha `popstate` para restaurar desde history.
- `src/components/search/Filters.astro` — UI con inputs que disparan `setFilters`.

## Flujo de interaccion (secuencial)

**Carga inicial**:
1. Usuario llega a `/search?t=gasfiter&c=las-condes&r=4`.
2. SSR (`search.astro`):
   - `const params = parseSearchParams(Astro.url.searchParams)`.
   - Fetch server-side a `/api/v1/search?...` con los params.
   - Render HTML con items ya filtrados.
3. Cliente hidrata: `useSearchState` lee `window.location.search` → estado coherente con SSR.

**Cambio de filtro**:
1. Usuario cambia un input en `Filters.astro`.
2. Hook `setFilters({ ...current, t: 'electricista' })`.
3. Estado actualizado + `history.pushState(null, '', '?t=electricista&c=las-condes&r=4')`.
4. Fetch a `/api/v1/search?t=electricista&...` con nuevos params.
5. UI actualiza items.

**Back/Forward**:
1. Usuario presiona back.
2. Evento `popstate` dispara.
3. Hook re-lee `window.location.search`, actualiza estado, hace fetch.

## Capa de servicios

- `src/lib/utils/searchUrl.ts`:
  - `parseSearchParams(searchParams)` — lee y normaliza (corta, valida Zod).
  - `serializeSearchParams(params)` — escribe en formato corto.
- Sin servicio de backend nuevo.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/utils/searchUrl.test.ts` | round-trip parse/serialize; params faltantes defaults; params inválidos caen a default con warning |
| Integracion | `tests/integration/search/url-params.test.ts` | `/api/v1/search?t=gasfiter&c=las-condes&r=4` retorna resultados coherentes con los params (param names cortos) |
| E2E | `tests/e2e/search-url-state.spec.ts` | Aplicar filtros → URL cambia → reload → estado preservado → back → filtros previos |

## Dependencias y secuencia

- **Bloqueado por:** HU-06.1 (endpoint base), HU-06.2 (filtros), HU-06.4 (autocomplete para inputs).
- **Bloquea a:** HU-06.6 (vista grid/lista lee estado de URL para mantener preferencia).
- **Recursos compartidos:** `src/lib/utils/searchUrl.ts`.

## Riesgos tecnicos

- Riesgo: SSR y cliente discrepan si la hidratación corre antes que `useSearchState` → Mitigación: el primer paint del cliente es no-interactivo hasta que `useSearchState` se inicializa (UI sigue funcional aunque los handlers tardan unos ms).
- Riesgo: URL larga con muchos filtros activos satura barra del navegador → Mitigación: nombres cortos (`t`, `c`, `r`); documentar.
- Riesgo: cambio de sort (HU-06.1 soporta `sort=recent|rating_desc|relevance`) no se persiste en URL → Mitigación: incluir en `serializeSearchParams`.
