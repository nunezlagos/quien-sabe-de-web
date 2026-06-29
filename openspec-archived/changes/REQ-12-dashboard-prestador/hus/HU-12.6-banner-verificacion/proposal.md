# Propuesta — HU-12.6 — Banner de estado de verificación

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita saber explícitamente si su perfil está verificado, en revisión o rechazado, junto con la acción siguiente (reenviar evidencias si fue rechazado). Hoy esa información no es evidente en el dashboard y bloquea aparecer en búsqueda. La HU sustenta OE1 al cerrar el bucle entre verificación y visibilidad.

## Mockups de referencia

- `mockups/dashboard-provider.html:68-75` — zona superior del panel principal donde aterriza el banner (justo arriba de los widgets de métricas).
- `mockups/verification.html:27-36` — hero verde con `ri-shield-check-fill` (estilo a reusar como referencia cromática).
- `mockups/verification.html:42-48` — caja de aviso azul con icono (`bg-blue-50 border border-blue-100 rounded-2xl`) que sirve de patrón visual base para el banner.
- `mockups/verification.html:55-74` — pasos 1-2-3 de verificación que se enlazan desde el CTA "Reenviar".

Nota: el banner concreto dentro del dashboard no está dibujado. UI a diseñar siguiendo el estilo de `mockups/verification.html:42-48` con variantes amarillo (pendiente) y rojo (rechazado).

## Alternativas consideradas

### Opcion A — Banner SSR antes de los widgets, sin endpoint dedicado
- El estado se lee en el render SSR de `dashboard-provider.astro` desde la tabla `providers`/`verifications`.
- Pro: cero round-trips cliente, banner siempre presente en el primer paint.
- Contra: requiere recarga para reflejar cambios tras enviar evidencias.

### Opcion B — Banner via fetch en isla cliente con polling
- Componente isla consulta `/api/v1/providers/me/verification` cada N segundos.
- Pro: refleja cambios cuando admin aprueba/rechaza sin recarga.
- Contra: trafico innecesario, complejidad.

## Decision

Se adopta **Opcion A** porque el cambio de estado de verificación lo controla el admin y ocurre raramente; un refresh del dashboard es suficiente. El estado se obtiene en SSR como parte del contexto del prestador. Si más adelante se requiere live-update, se introduce un endpoint dedicado sin romper el contrato del componente.

## Riesgos y mitigaciones

- Riesgo: prestador sin solicitud de verificación todavía. Mitigación: estado por defecto `not_requested` muestra el banner azul con CTA "Verifica tu oficio" → `/verification`.
- Riesgo: textos no internacionalizables. Mitigación: literales en español residen en el componente, marcados como candidatos a i18n.
- Riesgo: banner siempre visible obstaculiza el contenido al estar verificado. Mitigación: si `status === 'verified'`, no se renderiza nada.

## Metrica de exito

- Estado `pendiente` → banner amarillo con texto "Tu verificación está en revisión".
- Estado `rechazado` → banner rojo con motivo y botón "Reenviar" que navega a `/verification`.
- Estado `verificado` → no se muestra banner.
- Estado `no_solicitado` → banner azul con CTA "Verifica tu oficio" → `/verification`.
