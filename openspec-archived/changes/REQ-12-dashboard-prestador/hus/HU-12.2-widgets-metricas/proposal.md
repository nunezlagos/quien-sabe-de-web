# Propuesta — HU-12.2 — Widgets de métricas (últimos 30 días)

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita una lectura rápida del rendimiento de su perfil (visitas, contactos, valoración) para decidir si iterar contenido, precios o disponibilidad. Sustenta OE1 al cerrar el ciclo de feedback entre publicar y mejorar.

## Mockups de referencia

- `mockups/dashboard-provider.html:78-95` — grid `grid-cols-2 md:grid-cols-4 gap-4` con 4 tarjetas: Visitas Perfil (`124`), Contactos (`15`), Valoración (`4.8`), Mensajes Nuevos (`3`).
- `mockups/dashboard-provider.html:79-82` — patrón de tarjeta: número grande + label uppercase pequeño.
- `mockups/js/data.js:106-107` — modelo actual (`rating`, `reviewsCount`) usado en mockups.

## Alternativas consideradas

### Opcion A — Query en tiempo real por request
- Cada GET a `/api/v1/providers/me/metrics` ejecuta agregados sobre `contact_events` y `reviews`.
- Pro: datos siempre frescos, sin job adicional, simple de implementar.
- Contra: latencia crece con volumen, costo de D1 por consulta.

### Opcion B — Cache en KV con TTL corto (5 min)
- Misma query que A, pero el resultado se almacena en `SESSION` o un namespace dedicado con TTL.
- Pro: latencia baja en lecturas repetidas, costo D1 controlado.
- Contra: ligera staleness, complejidad de invalidación al recibir contacto/reseña.

### Opcion C — Vista materializada / tabla `provider_metrics_daily`
- Job que precomputa diariamente y el endpoint lee una fila.
- Pro: respuesta O(1), ideal a futuro.
- Contra: requiere cron worker, sobre-ingeniería para el volumen actual.

## Decision

Se adopta **Opcion A** por simplicidad y porque las queries son sobre dos ventanas de 30 días con `provider_id` indexado. Se deja preparado el contrato del endpoint para migrar a Opcion B/C cuando los datos crezcan, manteniendo la forma de respuesta estable.

## Riesgos y mitigaciones

- Riesgo: división por cero al calcular delta con base previa = 0. Mitigación: si `prev = 0`, `delta = null`.
- Riesgo: zona horaria de "últimos 30 días" inconsistente. Mitigación: ventana se calcula en UTC y se documenta.
- Riesgo: scope leak (ver datos de otro prestador). Mitigación: filtro obligatorio por `provider_id = providerActual` en todos los agregados.

## Metrica de exito

- `GET /api/v1/providers/me/metrics` responde 200 con `{ views_30d, contacts_30d, rating_avg, reviews_count, delta_vs_prev_30d: { views, contacts } }` en menos de 200 ms p95 con datos típicos.
- Cuatro tarjetas del mockup renderizan los valores correctos del backend.
- Un prestador no puede obtener métricas de otro (test de integración).
