# Diseño técnico — HU-18.5 — Dashboard de KPIs vs targets OE

**REQ padre:** REQ-18-observabilidad-analytics

## Modelo de datos

Sin schema nuevo. Lecturas sobre `events_log` (HU-18.1):

- KPI OE1 (p95 search < 500 ms): asume `props.latency_ms` opcional en eventos `search` (a añadir en allowlist de HU-18.2 cuando se instrumente p95). Ventana: últimos 60 min.
- KPI OE2 (precisión search): `count(events where event='search' AND props.clicked=true) / count(events where event='search')`. Ventana: últimas 24 h.
- KPI OE3 (ratio donaciones): `count(events where event='donation') / count(distinct sesiones con actor_role='user')` sobre últimas 24 h. Definición sujeta a refinamiento en review del PO.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/admin/analytics/kpis` | GET | sesión + `role='admin'` | (query) `window=60m\|24h\|7d` opcional | `{ "oe1": {...}, "oe2": {...}, "oe3": {...}, "generated_at": <iso> }` | 401 (sin sesión), 403 (no admin), 500 |

Forma de cada bloque OE:

```
{
  "label": "OE1 — p95 búsqueda",
  "value": 412,
  "unit": "ms",
  "target": 500,
  "comparator": "lt",
  "status": "ok" | "warn" | "fail" | "empty",
  "sample_size": 1234
}
```

`status:"empty"` cuando `sample_size === 0` → la UI muestra "Sin datos aún".

## Validaciones Zod

```ts
// src/lib/validators/admin/analytics.ts (pseudocódigo)
export const kpisQuery = z.object({
  window: z.enum(['60m','24h','7d']).default('60m'),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/dashboard-admin.astro` — extender la página existente del admin (consolidada del mockup) para incluir la sección `analytics-section`.
- Mockup base: `mockups/dashboard-admin.html:63-144` (estructura main + secciones intercambiables).
- Ruta funcional: `/dashboard-admin#analytics`.

### Componentes Astro reutilizables

- `src/components/admin/AnalyticsDashboard.astro` — orquestador de la sección.
  - Mockup base: `mockups/dashboard-admin.html:67-143`.
  - Props: `kpis: { oe1, oe2, oe3 }` (snapshot SSR inicial).
  - Islas requeridas: sí, una isla `client:load` que cada 60 s hace `fetch('/api/v1/admin/analytics/kpis')` y re-renderiza valores.

- `src/components/admin/KpiCard.astro` — tarjeta individual.
  - Mockup base: `mockups/dashboard-admin.html:69-77` (estructura `bg-white p-6 rounded-2xl shadow-sm border border-gray-100`, ícono, badge, h3 + número).
  - Props: `{ label, value, unit, target, comparator, status, sampleSize }`.
  - Islas requeridas: no (re-renderizado desde el padre).

- `src/components/admin/KpiEmptyState.astro` — placeholder "Sin datos aún".
  - Mockup base: `mockups/dashboard-admin.html:268-274` (estilo `text-center` con ícono grande y `text-gray-500`).
  - Props: `{ label }`.

- Nav-link de sidebar: añadir entrada en `mockups/dashboard-admin.html:22-39` siguiendo el patrón existente (`<a data-target="analytics-section">`).

## Flujo de interacción (secuencial)

1. Admin navega a `/dashboard-admin` y hace click en el nav-link "Analytics" del sidebar (`dashboard-admin.html:22-39` patrón).
2. JS de tabs (`mockups/js/dashboard-admin.js:15-46`) oculta otras secciones y muestra `#analytics-section`.
3. La sección viene SSR-rendeada con un snapshot inicial provisto por el server (`Astro.locals.runtime.env.DB` consultando `events_log`).
4. Una isla `client:load` arranca un `setInterval(60000)` que hace `fetch('/api/v1/admin/analytics/kpis?window=60m')`.
5. Por cada respuesta, la isla actualiza el DOM de las tres `KpiCard` (valor, comparador vs target, estado).
6. Si `status === 'empty'`, se renderiza `KpiEmptyState`.

## Capa de servicios

- `src/lib/services/analytics/kpis.service.ts` — pseudocódigo:
  - `computeOE1(env, windowMs): Promise<KpiBlock>` — p95 latencia search.
  - `computeOE2(env, windowMs): Promise<KpiBlock>` — ratio precisión search.
  - `computeOE3(env, windowMs): Promise<KpiBlock>` — ratio donaciones.
  - `getKpisSnapshot(env, window): Promise<KpisResponse>`
- Caching: wrapper en KV con clave `cache:kpis:<window>` y TTL 30 s.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/analytics/kpis.test.ts` | `computeOE1/2/3` sobre fixtures D1; estados `ok/warn/fail/empty`. |
| Integración | `tests/integration/admin/analytics-kpis.test.ts` | GET sin sesión → 401; con sesión user → 403; con admin → 200 + shape correcto; dataset vacío → todos `status:'empty'`. |
| E2E | `tests/e2e/admin-analytics.spec.ts` | Login admin → entrar a `#analytics` → 3 widgets visibles; disparar `search` → en <60 s el KPI OE1 cambia su `sample_size`. |

## Dependencias y secuencia

- **Bloqueado por:** HU-18.1 (tabla), HU-18.3 (datos reales), idealmente HU-18.2 ya cableando `latency_ms` y `clicked` en `props` de `search`.
- **Bloquea a:** ninguna directa; habilita la medición de OE.
- **Recursos compartidos:** página `dashboard-admin.astro`, sidebar, binding `DB`, binding `SESSION` (para caché).

## Riesgos técnicos

- p95 calculado vía SQL puede ser caro en D1 si el set crece → usar ventana acotada (60 min) y considerar precomputar en KV cada 30 s.
- Definición de "precisión search" puede cambiar tras review → encapsular en `computeOE2` para iterar sin tocar el endpoint.
- Estado `empty` debe distinguirse de `0` real → la UI prueba `status==='empty'` antes que `value===0`.
- Refresco cada 60 s genera carga moderada → caché KV 30 s amortigua.
