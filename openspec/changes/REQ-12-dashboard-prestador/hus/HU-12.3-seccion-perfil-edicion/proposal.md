# Propuesta — HU-12.3 — Sección de edición de perfil inline

**Estado:** propuesta | **REQ padre:** REQ-12-dashboard-prestador

## Contexto

El prestador necesita editar su perfil (nombre, oficio, biografía, galería) sin abandonar el dashboard. Reduce fricción y acelera el ciclo de mejora, sustentando OE1. La HU reutiliza el endpoint `PATCH /api/v1/providers/me` definido en REQ-04 sin redefinir contrato.

## Mockups de referencia

- `mockups/dashboard-provider.html:97-123` — banner compacto con avatar editable (`id="avatar-preview"`), nombre y CTA "Cancelar" / "Guardar".
- `mockups/dashboard-provider.html:125-195` — formulario de edición: Nombre Completo, Oficio Principal (select), Biografía (textarea), Galería de Trabajos (hasta 5 fotos), botón "Guardar Cambios".
- `mockups/dashboard-provider.html:131-142` — grid 2 columnas con Nombre y Oficio.
- `mockups/dashboard-provider.html:158-186` — grid de 5 slots para imágenes con CTA upload.
- `mockups/dashboard-provider.html:228-352` — sección "Mi Horario de Atención" (incluida en la sección de perfil).

## Alternativas consideradas

### Opcion A — Form completo con submit único `PATCH /api/v1/providers/me`
- Un solo botón "Guardar Cambios" envía todos los campos modificados.
- Pro: simple, atómico, alineado con el mockup (`mockups/dashboard-provider.html:189-193`).
- Contra: errores parciales (ej. imagen falla) abortan toda la edición.

### Opcion B — Auto-save por campo (debounce)
- Cada cambio se persiste al perder foco.
- Pro: cero clicks de guardado, mejor UX percibida.
- Contra: requiere endpoint resiliente a updates parciales, riesgo de save en estado inválido, mockup no lo sugiere.

## Decision

Se adopta **Opcion A** porque coincide con el mockup, simplifica validación y deja explícito el momento de persistencia. La subida de imágenes y la edición del horario se manejan con sub-flujos: imágenes vía endpoint dedicado (REQ-04), horario con submit propio (`mockups/dashboard-provider.html:349-351`).

## Riesgos y mitigaciones

- Riesgo: cambio de oficio dispara reindex (link a REQ-04.5) y puede tardar. Mitigación: toast "indexando..." y mostrar estado optimista en UI.
- Riesgo: validación `hourly_rate_clp` negativo o fuera de rango. Mitigación: validación Zod en cliente y servidor con mensaje al lado del campo.
- Riesgo: galería supera 5 imágenes. Mitigación: deshabilitar slot de upload cuando `gallery.length >= 5` (`mockups/dashboard-provider.html:181-185`).

## Metrica de exito

- Edición de biografía y oficio persiste y refleja en `GET /api/v1/providers/me` en menos de 500 ms.
- Validación inline de `hourly_rate_clp` negativo bloquea submit sin request.
- Cambio de oficio dispara reindex y los resultados de búsqueda reflejan el nuevo oficio en el siguiente request.
