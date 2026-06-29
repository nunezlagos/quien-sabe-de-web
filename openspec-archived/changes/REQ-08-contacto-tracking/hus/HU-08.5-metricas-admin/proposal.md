# Propuesta — HU-08.5 — Métricas globales de contacto para admin

**Estado:** propuesta | **REQ padre:** REQ-08-contacto-tracking

## Contexto

El admin necesita el total agregado de contactos efectivos en la plataforma, con desglose por canal y por mes, más el avance vs target OE2 (5.000 año 1, 25.000 año 2). Es el termómetro principal del objetivo estratégico OE2 y alimenta REQ-13 (dashboard admin).

## Mockups de referencia

- `mockups/dashboard-admin.html:67-105` — grilla de KPIs admin (4 cards). La card "Contactos Efectivos OE2" se sumará a este grid siguiendo el estilo de las cards existentes. UI a diseñar siguiendo este estilo.
- `mockups/dashboard-admin.html:107-143` — sección "Visitas Semanales" con barras CSS; el gráfico mensual de contactos seguirá este estilo.
- `mockups/js/dashboard-admin.js` — modelo de datos del mockup actual; se extenderá para incluir `contactsMetrics`.

## Alternativas consideradas

### Opcion A — Endpoint admin `/api/v1/admin/analytics/contacts` con query params
- Endpoint con `?range=last_30d|ytd|all` que devuelve agregados.
- Pro: estructura consistente con HU-08.4.
- Pro: facilita reutilizar para reports / exports futuros.
- Contra: lógica de cálculo de YTD y target requiere `settings`.

### Opcion B — Vista pre-calculada via cron
- Cron mensual que escribe `analytics_summary` y el endpoint solo lo lee.
- Pro: lectura O(1).
- Contra: hay que mantener el cron; defasaje de hasta 1 mes; sobre-ingeniería para el volumen esperado.

### Opcion C — Cliente computa todo
- Endpoint que devuelve eventos raw, cliente agrega en JS.
- Pro: backend simple.
- Contra: viola privacy (expone IPs hash); transferencia masiva; inviable a 25k+ eventos.

## Decision

Se elige **Opcion A**. Mantiene el patrón de HU-08.4, encapsula la lógica de target en backend, y permite parámetros explícitos (`range`) testables. Si crece el volumen, se puede sumar caché KV con TTL 5 min sin cambiar contrato.

## Riesgos y mitigaciones

- Riesgo: tabla `settings` no existe aún → Mitigación: hardcodear el target en una constante exportada hasta que exista; documentar deuda técnica.
- Riesgo: filtros por rango se interpretan distinto cliente/servidor → Mitigación: definir explícitamente los valores aceptados (`last_30d`, `ytd`, `all`) en Zod.
- Riesgo: 403 mal aplicado expone datos sensibles → Mitigación: middleware admin obligatorio (`Astro.locals.session.role === 'admin'`); tests integración cubren no-admin.
- Riesgo: cálculo YTD se desfasa si el cliente cambia de año a mitad de carga → Mitigación: derivar `yearStart` desde el reloj del servidor.

## Metrica de exito

- `GET /api/v1/admin/analytics/contacts?range=ytd` con sesión admin devuelve forma documentada.
- Mismo endpoint con sesión no-admin devuelve 403.
- KPI nuevo en `dashboard-admin.html` muestra `ytd_progress_vs_target` en porcentaje.
- Datos coinciden con sumas manuales en D1 (`SELECT COUNT(*) FROM contact_events WHERE created_at >= :year_start`).
