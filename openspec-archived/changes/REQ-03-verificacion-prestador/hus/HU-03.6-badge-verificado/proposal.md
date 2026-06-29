# Propuesta — HU-03.6 — Badge de verificación en perfil público

**Estado:** propuesta | **REQ padre:** REQ-03-verificacion-prestador

## Contexto

Una vez verificado (HU-03.5), el prestador debe mostrar un badge que transmita confianza al vecino que visita su perfil público. Esta HU implementa el componente `<VerifiedBadge />` y el flag `verified: boolean` en el endpoint público del prestador. Es el "premio" visible del flujo de verificación — sin él, el prestador no tiene incentivo para completar el proceso. P1 porque el MVP puede funcionar sin badge visible, pero el badge es lo que justifica operacionalmente la verificación.

## Mockups de referencia

- `mockups/profile.html:65-67` — elemento `#profile-verified-badge` con `class="hidden"` por defecto y `<i class="ri-shield-check-fill"></i> Verificado`. Esta HU implementa exactamente ese componente: el JS del mockup lo muestra/oculta según la flag.

## Alternativas consideradas

### Opcion A — Flag derivado en cada request público del perfil
- Helper `isVerified(db, providerId)` ejecuta `SELECT 1 FROM provider_verifications WHERE user_id = ? AND status = 'verificado' LIMIT 1`.
- Cache opcional con KV (5min TTL) si la latencia se vuelve problema.
- Pro: una sola fuente de verdad (la tabla de verificaciones); refleja cambios inmediatamente.
- Contra: query extra en cada visita al perfil (mitigable con cache).

### Opcion B — Columna `verified_at` denormalizada en `providers` (o `users`)
- Trigger/sync que mantiene `verified_at` actualizado al transicionar la verificación.
- Pro: lectura O(1) sin join.
- Contra: dos fuentes de verdad; riesgo de drift entre `provider_verifications.status` y `users.verified_at`.

### Opcion C — Cachear en KV con TTL largo (1h)
- Pro: ultra-rápido en lectura.
- Contra: ventana de hasta 1h donde un prestador recién verificado no muestra badge; UX confusa.

## Decision

Se elige **Opcion A** para el MVP, con índice sobre `(user_id, status)` para que la query sea O(1). El cache se agrega sólo si el profiling muestra瓶颈 (no anticipado para volumen de OE1). El badge como componente Astro renderiza condicionalmente según el flag, sin JS adicional: el server decide si el HTML contiene o no el elemento.

## Riesgos y mitigaciones

- Riesgo: el flag se queda stale si el admin revierte la verificación → Mitigación: HU-03.5 sólo permite transiciones `pendiente → verificado/rechazado`; no hay `verificado → pendiente` (state machine), así que el flag es estable.
- Riesgo: query en cada visita al perfil satura D1 → Mitigación: el índice cubre la query; si escala, agregar cache (futuro).
- Riesgo: el badge muestra "Verificado" a un prestador con verificación `rechazado` por bug → Mitigación: el helper `isVerified` filtra estrictamente `status='verificado'`; test explícito.

## Metrica de exito

- GET `/api/v1/providers/juan-perez-gasfiter-las-condes` con prestador verificado → 200 con `verified: true` en el body.
- Visita HTML `/p/juan-perez-gasfiter-las-condes` → contiene `<VerifiedBadge />` con `data-verified="true"`.
- Visita al perfil de un prestador sin verificación → NO contiene `<VerifiedBadge />` en el DOM.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/services/providers/verified.ts`.
