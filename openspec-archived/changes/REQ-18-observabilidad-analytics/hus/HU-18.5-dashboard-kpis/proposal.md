# Propuesta — HU-18.5 — Dashboard de KPIs vs targets OE

**Estado:** propuesta | **REQ padre:** REQ-18-observabilidad-analytics

## Contexto

Cierra el ciclo de OE1/OE2/OE3: el admin necesita ver, dentro del panel, tres widgets con el valor actual del KPI vs su target (p95 search < 500 ms, precisión search 100 %, ratio donaciones 80 %). Esta HU monta la vista admin y el endpoint que la alimenta, reaprovechando la estética de tarjetas y gráfico que el mockup ya define.

## Mockups de referencia

- `mockups/dashboard-admin.html:67-105` — grid de 4 KPI cards (Usuarios Totales, Oficios Activos, Valoración Media, Solicitudes). Sirve de base visual: misma rejilla `grid-cols-1 md:grid-cols-4 gap-6`, mismas cards `bg-white p-6 rounded-2xl shadow-sm border border-gray-100` con ícono, badge de tendencia y número grande.
- `mockups/dashboard-admin.html:69` — patrón de tarjeta individual.
- `mockups/dashboard-admin.html:107-143` — sección "Chart" con `bg-white p-8 rounded-3xl shadow-sm` y selector de período (`Últimos 7 días / Este Mes`). Reutilizable para histograma p95.
- `mockups/dashboard-admin.html:22-39` — sidebar de navegación. Se añadirá un nav-link `data-target="analytics-section"` para `/dashboard-admin#analytics`.
- `mockups/js/dashboard-admin.js:7-13` — mapa `titles` de la sección; añadir entrada `analytics-section: 'Analytics / KPIs OE'`.

## Alternativas consideradas

### Opción A — Sección nueva dentro del dashboard-admin existente, endpoint dedicado y SSR + isla mínima
- Añadir `<div id="analytics-section">` con tres tarjetas KPI (estructura idéntica a las del mockup) más un widget de gráfico. El endpoint `/api/v1/admin/analytics/kpis` calcula los tres valores sobre `events_log` (HU-18.1). La página SSR-rendea el último snapshot y una isla refresca cada 60 s.
- Pro: respeta el mockup, reaprovecha tokens visuales, una sola página, SEO/SSR ok, refresco simple.
- Contra: cálculo de p95 requiere ventana móvil; aceptable con índice `(event, created_at desc)`.

### Opción B — Página separada `/admin/analytics` fuera del dashboard
- Vista nueva con su propio layout.
- Contra: rompe el patrón del mockup y duplica chrome (sidebar/header).

### Opción C — Cliente fetch puro sin SSR (todo desde `client:load`)
- La isla calcula y renderiza desde cero al montar.
- Contra: spinner permanente al entrar, peor UX, no aprovecha SSR de Astro.

## Decisión

Se adopta **Opción A**. Es coherente con la estructura del mockup (`dashboard-admin.html` con secciones intercambiables vía nav-link), aprovecha SSR, y minimiza JavaScript en cliente (solo refresco periódico). Los widgets reusan tokens visuales del mockup, garantizando consistencia.

## Riesgos y mitigaciones

- p95 sobre dataset creciente puede ser costoso → ventana acotada (últimos 60 min para p95, últimas 24 h para ratios) e índice ya planeado en HU-18.1.
- Estado vacío puede mostrar "0" en lugar de "Sin datos" → tests Gherkin explícitos lo cubren.
- Cuasi-tiempo-real ≤5 min → refresco cada 60 s en cliente; caché TTL 30 s en endpoint para amortiguar.
- "Precisión search" no tiene definición operacional única → en esta HU se define como `count(search con clicks_result>=1) / count(search)`; se documenta en el endpoint.

## Métrica de éxito

- Al entrar a `/dashboard-admin#analytics` se ven los tres widgets renderizados con datos reales del último período.
- Dataset vacío → estado "Sin datos aún" visible (no "0%").
- Tests integración del endpoint y E2E Playwright (búsqueda → KPI refresca en <60 s) verdes.
