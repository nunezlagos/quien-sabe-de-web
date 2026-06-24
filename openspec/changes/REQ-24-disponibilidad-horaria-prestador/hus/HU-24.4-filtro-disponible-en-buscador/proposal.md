# Propuesta — HU-24.4 — Filtro available_now en /search

**Estado:** propuesta | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Contexto

El vecino con urgencia quiere filtrar sólo prestadores disponibles ahora mismo. El endpoint `/api/v1/search` de REQ-06 ya soporta filtros por oficio y comuna; esta HU agrega `?available_now=true` que aplica el helper `isAvailableNow` (HU-24.3) a cada prestador del resultado. La UI del hero search en `mockups/index.html:76-111` gana un checkbox "Disponible ahora" después del select de comuna, con el mismo estilo de borde y rounded.

## Mockups de referencia

- `mockups/index.html:76-111` — hero search con select oficio + select comuna + input keyword + botón Buscar. Insertar checkbox "Disponible ahora" después del select comuna (entre líneas 96 y 99).
- `mockups/index.html:155-179` — sidebar de filtros con checkboxes por oficio; patrón `rounded text-primary focus:ring-primary border-gray-300` reutilizable.

## Alternativas consideradas

### Opción A — Subquery SQL con `provider_availability` filtrado por día y hora actual
- `SELECT providers.* WHERE EXISTS (SELECT 1 FROM provider_availability WHERE provider_id = providers.id AND day_of_week = ? AND start_time <= ? AND ? < end_time)`.
- Pro: filtra en una sola query SQL; eficiente.
- Pro: reutilizable para `manual_availability` (HU-24.5) con JOIN adicional.
- Contra: requiere computar el día/hora actual Chile en el servidor (helper de HU-24.3).

### Opción B — Filtrar en código después del SELECT inicial
- Pro: query original sin cambios; filtro en aplicación.
- Contra: con miles de prestadores, descargar todos para filtrar en memoria es ineficiente.

### Opción C — Materializar `is_available_now` en `providers` con job
- Pro: query trivial.
- Contra: latencia de hasta 1 minuto; operacional.

## Decisión

Se elige **Opción A**. Subquery SQL con EXISTS aprovecha el índice `(provider_id)` de `provider_availability` (HU-24.1) y mantiene la query declarativa.

## Riesgos y mitigaciones

- Riesgo: la query SQL se vuelve lenta con muchos prestadores → Mitigación: el índice `(provider_id)` cubre la subquery; EXPLAIN verifica uso del índice.
- Riesgo: timezone del servidor ≠ Chile → Mitigación: el helper `getLocalHourAndDay` de HU-24.3 calcula correctamente con `Intl.DateTimeFormat`.
- Riesgo: el checkbox es trivial pero falta el empty state → Mitigación: si la combinación `?available_now=true&commune=X` no devuelve nada, renderizar CTA "Ver todos los prestadores" que limpia el filtro.

## Métrica de éxito

- `GET /api/v1/search?trade=gasfiter&available_now=true` con fixture lunes 10:00 Chile: devuelve sólo prestadores con rango lunes 9-13.
- Combinado con `commune=Santiago&available_now=true`: ambos filtros aplican (intersección).
- Empty state: si no hay resultados, UI muestra CTA "Ver todos".
- Sabotaje: olvidar el `EXISTS` en la subquery → devuelve todos los prestadores independientemente de la hora → test con fixture lunes 22:00 verifica que prestadores con rango lunes 9-13 NO aparecen → restaurar.