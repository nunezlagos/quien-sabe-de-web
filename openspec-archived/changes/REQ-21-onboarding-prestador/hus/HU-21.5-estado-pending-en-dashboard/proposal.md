# Propuesta — HU-21.5 — Banner verificación pendiente en dashboard prestador

**Estado:** propuesta | **REQ padre:** REQ-21-onboarding-prestador

## Contexto

Cuando el prestador completa el wizard (HU-21.1 → HU-21.4) queda con `providers.status="pending_verification"` durante el período entre la subida del certificado y la aprobación admin (REQ-03). Sin señal visual clara, vuelve al dashboard y no entiende por qué su perfil no aparece en búsqueda. Esta HU agrega un banner contextual en `/dashboard-provider` arriba del card de edición con tres variantes según el estado: pending (amarillo), approved (oculto), rejected (rojo con CTA Reintentar).

## Mockups de referencia

- `mockups/dashboard-provider.html:97-122` — área sobre el card "Editar Perfil" donde se inserta el banner.
- `mockups/dashboard-user.html:80` — patrón de badge `bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full` reusado para variantes.
- `mockups/verification.html:42-48` — patrón de banner con icono + heading + párrafo.

## Alternativas consideradas

### Opción A — Componente `<ProviderStatusBanner />` con prop `status`
- Astro server-rendered: la página `/dashboard-provider` consulta `providers.status` del usuario logueado y pasa la prop.
- Pro: server-rendered, sin JS; el SEO/SSR es inmediato.
- Pro: una sola fuente de verdad (la query a D1).
- Contra: si el estado cambia, requiere refresh de página. Aceptable: el prestador edita datos y refresca explícitamente.

### Opción B — Isla `client:load` con polling cada 30s
- Pro: refleja cambios en tiempo real.
- Contra: overhead innecesario para un caso de uso donde el estado cambia raramente (1-2 veces por semana).

### Opción C — Toast efímero en lugar de banner persistente
- Pro: no ocupa espacio.
- Contra: el toast desaparece y el prestador olvida. El banner es discovery pasivo.

## Decisión

Se elige **Opción A**. El estado del prestador es información crítica que debe ser visible inmediatamente al cargar el dashboard. Server-rendered con refresh manual es suficiente.

## Riesgos y mitigaciones

- Riesgo: la query a `providers` agrega latencia al SSR del dashboard → Mitigación: query ya existe (REQ-12 dashboard), esta HU sólo agrega 1 columna (`status`) al `SELECT`. Sin impacto medible.
- Riesgo: variantes pending/rejected usan colores muy similares al resto del sitio → Mitigación: documentar la paleta exacta en `design.md` para que QA valide.
- Riesgo: el banner tapa el botón "Guardar Cambios" del form en mobile → Mitigación: el banner es sticky a la parte superior del main column (`md:col-span-3`), no absoluto; fluye naturalmente.

## Métrica de éxito

- E2E con `providers.status="pending_verification"`: banner amarillo visible con texto "Tu perfil está en revisión" + botón "Ir a verificación".
- E2E con `providers.status="approved"`: banner NO presente en el DOM.
- E2E con `providers.status="rejected"` + `reason`: banner rojo con texto del motivo + botón "Reintentar" que enlaza a `/verification`.
- Sabotaje: cambiar `status="pending_verification"` a `status="approved"` en la query → E2E con fixture pending verifica que el banner sigue visible → restaurar.