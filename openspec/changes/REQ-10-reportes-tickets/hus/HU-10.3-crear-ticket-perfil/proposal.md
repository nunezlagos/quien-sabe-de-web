# Propuesta — HU-10.3 — Crear ticket desde perfil de prestador

**Estado:** propuesta | **REQ padre:** REQ-10-reportes-tickets

## Contexto

Cuando un vecino autenticado visita el perfil de un prestador y tiene una mala experiencia, debe poder reportarlo con un solo click. El ticket queda ligado al prestador (`target_provider_id`) y al vecino (`created_by_user_id`). Si el vecino ya tiene un ticket abierto contra el mismo prestador, no se bloquea la creación (puede haber problemas distintos), pero el admin recibe un warning interno. Esta HU reusa el endpoint POST `/api/v1/tickets` con un schema distinto al anónimo (HU-10.2).

## Mockups de referencia

- `mockups/profile.html:238-296` — modal "Reportar / Ayuda" con campos Nombre, RUT, Email, Detalle, Evidencia. La UI de esta HU se materializa como `ReportModal.astro` siguiendo este patrón.

## Alternativas consideradas

### Opcion A — Reusar POST `/tickets` con `authenticatedTicketCreateSchema` y modal dedicado
- POST `/api/v1/tickets` con schema distinto cuando hay sesión.
- Componente `ReportModal.astro` que abre desde botón "Reportar" del perfil.
- Pro: un solo endpoint; las dos variantes se distinguen por schema.
- Pro: la UI es ortogonal al endpoint.
- Contra: el endpoint queda con dos "modos" (anónimo vs autenticado); documentar claramente.

### Opcion B — Endpoint separado `/api/v1/providers/:id/tickets`
- Pro: URL semántica; un schema siempre.
- Contra: duplica lógica de creación y rate-limit; complica el router.

### Opcion C — Capturar reporte como reseña negativa especial
- Pro: reusa schema.
- Contra: contradice la separación entre "opinión pública" (reseñas) y "soporte" (tickets).

## Decision

Se elige **Opcion A**. Un solo endpoint, dos schemas según sesión. La UI del modal es ortogonal al endpoint y se materializa en esta HU.

## Riesgos y mitigaciones

- Riesgo: vecino crea tickets contra prestador inexistente → Mitigación: validar FK en DB; Zod rechaza `target_provider_id` no numérico.
- Riesgo: el modal de Reporte pide Nombre/RUT/Email manualmente cuando el vecino ya está autenticado → Mitigación: prellenar `Nombre` con el de la sesión; `Email` con `session.user.email`; `RUT` no se pide (no es necesario para el reporte).
- Riesgo: el vecino reporta al mismo prestador 5 veces → Mitigación: warning interno en la creación (campo `internal_note=true` en un ticket_message automático con `body='[system] vecino X ya tiene N tickets abiertos contra este prestador'`); el admin ve el warning.
- Riesgo: el modal permite subir "Evidencia" pero el endpoint no acepta adjuntos → Mitigación: por ahora el campo de evidencia es decorativo; se documenta que "subir fotos" es HU futura (REQ-10.6-extensión).

## Metrica de exito

- POST autenticado `kind=mal_servicio` + `target_provider_id=42` + subject + body → 201 con `created_by_user_id=<vecino_id>`, `target_provider_id=42`.
- POST autenticado `kind=suplantacion` sin `target_provider_id` → 422.
- POST autenticado `target_provider_id=99999` (inexistente) → 422.
- POST autenticado contra mismo prestador 2da vez → 201 + ticket_message con `internal_note=true` mencionando el warning.
- Modal abre desde `/p/<slug>` botón "Reportar", campos prellenados con datos del vecino.
