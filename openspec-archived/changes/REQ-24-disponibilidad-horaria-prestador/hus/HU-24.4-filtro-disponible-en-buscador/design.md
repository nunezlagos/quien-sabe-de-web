# Diseño técnico — HU-24.4 — Filtro available_now en /search

**REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Modelo de datos

No introduce tablas. Consume `provider_availability` (HU-24.1) y `providers` (REQ-04).

## Contrato de API

Extensión de `GET /api/v1/search` (REQ-06):

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `available_now` | `'true' \| undefined` | undefined | Si está presente, filtra prestadores disponibles en este momento |

Combinable con filtros existentes (`trade`, `commune`, `q`). La query se aplica con AND lógico.

## Validaciones Zod

```ts
// src/lib/validators/search.ts (extensión)
export const searchQuerySchema = z.object({
  trade: z.string().optional(),
  commune: z.string().optional(),
  q: z.string().max(100).optional(),
  available_now: z.enum(['true']).optional(),  // presencia como string 'true'
})
```

## Componentes UI

### Extensión del endpoint
- `src/pages/api/v1/search.ts`:
  - Parse con `searchQuerySchema` (extendido).
  - Si `available_now === 'true'`:
    - `const { dayOfWeek, hhmm } = getLocalHourAndDay(new Date(), 'America/Santiago')`
    - Agregar al WHERE: `AND EXISTS (SELECT 1 FROM provider_availability pa WHERE pa.provider_id = providers.id AND pa.day_of_week = ? AND pa.start_time <= ? AND ? < pa.end_time)` con binds `[dayOfWeek, hhmm, hhmm]`.
  - Ordenar resultados por rating y `available_now` primero.

### Extensión de la UI hero (`src/pages/index.astro`)
- Después del select de comuna (líneas 96-98 de `mockups/index.html`), agregar:
  ```html
  <label class="flex items-center gap-2 px-3 py-3 cursor-pointer">
    <input type="checkbox" id="available-now-checkbox" name="available_now" value="true"
           class="rounded text-primary focus:ring-primary border-gray-300">
    <span class="text-sm text-gray-700 font-semibold">Disponible ahora</span>
  </label>
  ```
- Listener JS: al cambiar el checkbox, actualiza la query string y refetch.

### Empty state
- Si la respuesta de search devuelve array vacío y `available_now=true`, mostrar CTA "Ver todos los prestadores" que limpia el filtro.

## Flujo de interacción (secuencial)

1. Visitante en `/` marca checkbox "Disponible ahora".
2. Click en "Buscar" o auto-submit → `GET /api/v1/search?available_now=true[&trade=&commune=&q=]`.
3. Backend aplica subquery EXISTS sobre `provider_availability` filtrado por día/hora Chile actuales.
4. Devuelve array de prestadores (puede ser vacío).
5. Si vacío, UI muestra empty state con CTA.
6. Si hay resultados, ranking prioriza `is_available_now` (todos en este caso lo son) y rating.

## Capa de servicios

`src/lib/services/availability/search.ts`:
- `filterAvailableNow(env, baseQuery, now: Date): DrizzleQuery` — agrega el `EXISTS` al query base.

Reutiliza `getLocalHourAndDay` de HU-24.3.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/search.test.ts` (extensión) — schema acepta `available_now='true'`; rechaza `available_now='yes'`; rechaza `available_now='1'`. |
| Integración | `tests/integration/search/available-now.test.ts` — fixture: 3 prestadores (uno con lunes 09-13, uno con martes 10-15, uno sin availability). Mock Date lunes 10:00 Chile. `GET /search?available_now=true` devuelve sólo el prestador 1. Combinado con `commune=Santiago&available_now=true` filtra adicionalmente por comuna. EXPLAIN QUERY PLAN muestra uso del índice. |
| E2E | `tests/e2e/search-available-now.spec.ts` — marcar checkbox → click Buscar → ver sólo prestadores disponibles; desmarcar → ver todos. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-06 (endpoint `/search` base), HU-24.1 (schema), HU-24.3 (helper `getLocalHourAndDay`).
- **Bloquea a:** ninguna HU directa.
- **Recursos compartidos:** `src/lib/services/availability/`, `src/pages/api/v1/search.ts`.

## Riesgos técnicos

- Riesgo: la subquery EXISTS con 3 binds puede ser lenta sin índice adecuado → Mitigación: índice `(provider_id)` ya existe; EXPLAIN valida. Si supera 50ms, agregar índice `(day_of_week, start_time, end_time)`.
- Riesgo: el checkbox auto-submit puede ser ruidoso (cada toggle dispara request) → Mitigación: el submit ocurre sólo al click "Buscar", no al toggle. El toggle sólo actualiza un hidden input del form.
- Riesgo: el helper `getLocalHourAndDay` se llama 2 veces por request (HU-24.3 + HU-24.4) → Mitigación: aceptable; el cálculo es de pocos microsegundos.