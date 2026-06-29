# Propuesta — HU-11.4 — Modal de edición de perfil del vecino

**Estado:** propuesta | **REQ padre:** REQ-11-dashboard-vecino

## Contexto

El vecino debe poder editar foto, comuna y preferencias desde el dashboard sin tener que ir a una página de configuración separada. La propuesta es un modal overlay que se abre desde el header del dashboard (botón "Editar") y reusa el endpoint `PATCH /api/v1/users/me/profile` que REQ-02 ya define para el onboarding. Esta HU es 100% frontend + integración: cero backend nuevo, pero requiere un modal accesible, validación inline de email, y refresco del header al guardar.

## Mockups de referencia

- `mockups/dashboard-user.html:148-189` — modal "Editar Mis Datos" con backdrop blur, header gris, grid de 2 columnas (nombre/apellido), input email, input teléfono opcional y CTA "Guardar Cambios". Replicamos este patrón visual pero con campos del modelo de datos real: `commune_id` (select poblado desde `communes`), `notify_email` (checkbox), `interests` (chips).
- `mockups/dashboard-user.html:29-32` — botón "Editar" con ícono `ri-edit-line` en la esquina superior derecha del header. Este es el disparador del modal.

## Alternativas considered

### Opcion A — Modal overlay (replica del mockup) abierto desde botón "Editar" del header
- Componente Astro + script ligero que abre/cierra el modal. Validación inline en cliente antes de fetch.
- Pro: UX familiar (mockup ya validado visualmente).
- Pro: no abandona el dashboard.
- Contra: requiere pequeño JS (mínimo 30 líneas para toggle, focus trap, ESC).

### Opcion B — Tab dedicada "Perfil" en el dashboard
- Reemplazar el modal por una tab nueva en `Layout.astro`.
- Pro: cero JS nuevo.
- Contra: el contenido del perfil (foto, comuna, intereses) es extenso y compite con las otras dos tabs por espacio vertical; peor UX mobile.

### Opcion C — Página dedicada `/dashboard-user/profile`
- Ruta nueva, formulario full-page.
- Pro: trivial de implementar.
- Contra: contradice el mockup y la historia de la HU ("sin abandonar el dashboard").

## Decision

Se elige **Opcion A**. El modal overlay replica el mockup, mantiene al usuario en contexto, y el costo de JS es marginal. La validación inline (email regex) corre en cliente; el servidor ya valida con Zod (REQ-02) por defensa en profundidad.

## Riesgos y mitigaciones

- Riesgo: el modal es inaccesible (sin focus trap, sin ESC, sin `aria-modal`) → Mitigación: implementar focus trap mínimo (foco al primer input al abrir, ESC cierra, click en backdrop cierra).
- Riesgo: el header no se refresca tras guardar → el usuario ve su comuna vieja → Mitigación: tras `PATCH` exitoso, invalidar la sesión cacheada (`Astro.locals.user`) y re-renderizar el header con datos nuevos.
- Riesgo: el modal se abre antes de que el JS hidrate → Mitigación: el modal arranca con `class="hidden"` en el SSR; sólo aparece tras click (mismo patrón que `mockups/dashboard-user.html:149`).

## Metrica de exito

- Click en botón "Editar" del header → modal aparece con valores actuales (commune, notify_email, interests).
- Submit con email inválido → error inline, NO se envía request.
- Submit con datos válidos → PATCH 200, modal se cierra, header refleja la nueva comuna al recargar.
- E2E Playwright: tres escenarios del `hu.md` verdes.
