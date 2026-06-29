# Propuesta — HU-08.4 — Métricas de contacto para el prestador

**Estado:** propuesta | **REQ padre:** REQ-08-contacto-tracking

## Contexto

El prestador necesita ver, dentro de su dashboard, cuántos contactos efectivos recibió en los últimos 30 días, desglosados por canal (whatsapp/phone/email) y por día, para evaluar el rendimiento de su perfil. Es input directo a REQ-12 (dashboard prestador) y refuerza OE2 desde la perspectiva del usuario individual.

## Mockups de referencia

- `mockups/dashboard-provider.html:78-95` — grid de "Quick Stats" donde aparece la card "Contactos" (línea 83-86 muestra el valor `15`).
- `mockups/dashboard-provider.html:355-360` — banner motivacional que cita el dato (refuerza la métrica como elemento de UI).
- Nota: el mockup actual solo muestra un total. El desglose por kind y por día se mostrará en HU futura del REQ-12 siguiendo este estilo visual. UI a diseñar siguiendo este estilo.

## Alternativas consideradas

### Opcion A — Endpoint dedicado `/api/v1/providers/me/contact-metrics`
- Endpoint REST autenticado por sesión que devuelve `{ total, by_kind, last_30d_by_day }`.
- Pro: aislado y testable; alineado con `src/api/v1/`.
- Pro: cliente (Astro o islas) puede pedirlo on-demand.
- Contra: requiere recomputar agregación en cada request; mitigable con caché corta.

### Opcion B — SSR completo en `dashboard-provider.astro`
- Calcular métricas en el render del dashboard, sin endpoint.
- Pro: una sola query, sin round-trip extra.
- Contra: no reutilizable si en el futuro queremos refresco AJAX, exportes CSV, o widgets independientes.

### Opcion C — Vista materializada / tabla pre-agregada
- Mantener una tabla `contact_metrics_daily` actualizada por trigger.
- Pro: lectura instantánea.
- Contra: D1 no soporta triggers complejos; añade write-amplification en HU-08.2.
- Contra: prematuro a este volumen.

## Decision

Se elige **Opcion A**. Mantiene consistencia con la arquitectura del proyecto (endpoint versionado, sesión, Zod), permite que el dashboard de REQ-12 lo consuma vía fetch o SSR, y deja la puerta abierta a una caché KV de 60s si crece la carga.

## Riesgos y mitigaciones

- Riesgo: agregación pesada si un prestador acumula miles de eventos/día → Mitigación: índice `(provider_id, created_at DESC)` definido en HU-08.1; consultar solo últimos 30 días.
- Riesgo: filtrado por sesión incorrecto deja ver métricas ajenas → Mitigación: derivar `providerId` exclusivamente de `Astro.locals.session.providerId`, nunca de input externo.
- Riesgo: huecos en `last_30d_by_day` (días sin eventos) confunden a clientes que grafican → Mitigación: el endpoint devuelve siempre 30 entradas, rellenando con `0`.

## Metrica de exito

- `GET /api/v1/providers/me/contact-metrics` retorna 200 con la forma documentada.
- Un prestador con 12 eventos en últimos 30 días obtiene `total: 12`.
- Un prestador A no puede leer métricas de B (sesión de A devuelve solo sus datos).
- KPI "Contactos" en `mockups/dashboard-provider.html:84` se alimenta desde este endpoint en la implementación de REQ-12.
