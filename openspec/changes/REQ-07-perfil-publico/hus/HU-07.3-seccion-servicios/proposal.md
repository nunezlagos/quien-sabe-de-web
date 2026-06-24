# Propuesta — HU-07.3 — Sección de catálogo de servicios en perfil

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

La sección de servicios es el bloque "Servicios y Precios" del perfil público. Renderiza los servicios activos del prestador en su orden declarado, con precio formateado en CLP (o "Consultar" si el precio está oculto), y muestra la cobertura por comuna como chips. Es el puente entre el perfil (REQ-07) y el catálogo (REQ-05), y antecede directamente la decisión de contacto del visitante.

## Mockups de referencia

- `mockups/profile.html:127-139` — bloque "Servicios y Precios" con header `ri-list-check`, info-box azul "Precios referenciales", lista `<ul>` con `service-item-template` (mockup `profile.html:172-177`).
- `mockups/index.html:328-357` — cards de proveedor en home; usan el mismo template de servicio para mantener consistencia visual.

## Alternativas consideradas

### Opcion A — Componente `ServicesSection.astro` que recibe servicios ya cargados desde HU-07.1
- El DTO `PublicProvider` (HU-07.1) ya incluye `services[]`. La sección sólo formatea.
- Pro: cero queries nuevas; reuso total del DTO.
- Pro: el formateo (`formatPriceClp`) se testea unitariamente sin tocar la DB.
- Contra: si el catálogo crece a 50+ servicios, el DTO crece en payload. Aceptable porque típicamente son 3-10.

### Opcion B — Sección auto-contenida que reconsulta `services` con su propio loader
- Pro: la sección es portable a otras vistas (e.g. un preview modal).
- Contra: duplica query; el DTO ya trae los datos.
- Contra: introduce inconsistencia potencial entre DTO y consulta directa (cache, filtros).

### Opcion C — Render client-side con fetch paginado
- Pro: soporta "ver más" sin recargar.
- Contra: el criterio de aceptación exige SSR completo, sin spinner.

## Decision

Se elige **Opcion A**. La sección es presentacional pura sobre el DTO. Si en el futuro el catálogo crece, se introduce paginación a nivel del endpoint (HU-07.1), no acá.

## Riesgos y mitigaciones

- Riesgo: precio `0` se confunde con "Consultar" → Mitigación: el helper `formatPriceClp(0)` retorna `"$0"` (precio explícito) y sólo `null` mapea a "Consultar".
- Riesgo: orden de servicios no estable cuando `order` tiene empates → Mitigación: agregar `id ASC` como tiebreaker en la query de HU-07.1.
- Riesgo: el formateo CLP usa separador de miles equivocado en español chileno → Mitigación: usar `Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 })`.
- Riesgo: comuna no resuelta (sólo `slug` en `service_coverage`) → Mitigación: HU-07.1 ya devuelve nombres legibles (resueltos vía join en Drizzle); esta HU los recibe listos.

## Metrica de exito

- Render de perfil con 3 servicios activos → aparecen 3 filas en `ul#profile-services-list` en el orden declarado.
- Servicio con `status="inactive"` → no aparece en el HTML.
- Servicio con `price_clp=null` → texto "Consultar" en la celda de precio.
- Servicio con `coverage[]` de 3 comunas → 3 chips con `ri-map-pin-line` y nombre de comuna.
- Formato de precio: `$25.000` (no `$25000`, no `25.000 CLP`).
