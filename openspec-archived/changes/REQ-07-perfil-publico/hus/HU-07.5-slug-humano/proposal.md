# Propuesta — HU-07.5 — Slug humano y redirect desde ?id=

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

Las URLs legibles (`/p/juan-perez-gasfiter-las-condes`) mejoran la confianza del visitante y el SEO. Esta HU introduce un generador de slug a partir del nombre + oficio + comuna, deduplicado con sufijo numérico cuando hay colisión, y la migración que hace `providers.slug` UNIQUE. Además, la ruta legacy `/profile?id=42` debe hacer 301 al slug humano (HU-07.1 ya devuelve el slug en el DTO). Vinculado a OE2 (perfiles compartibles).

## Mockups de referencia

No aplica (HU 100% backend + redirect). El slug aparece implícito en la URL de `mockups/profile.html` (no hay mockup que muestre la barra de direcciones).

## Alternativas consideradas

### Opcion A — Generador basado en nombre + oficio + comuna con deduplicación `-2`, `-3`...
- `slugify(nombre)` + `slugify(oficio)` + `slugify(comuna)` → concatenar con `-`.
- Si ya existe en DB → probar `-2`, `-3`... hasta encontrar uno libre (dentro de un loop con `try/catch` UNIQUE).
- Pro: humano, predecible, sin caracteres raros.
- Pro: el helper `slugify` ya existe en `src/lib/utils/slug.ts` (HU-02.1).
- Contra: cambio de oficio o comuna obliga a regenerar slug (decisión fuera de scope: una sola generación al crear).

### Opcion B — Slug completamente aleatorio (nanoid)
- `slug = nanoid(10)`.
- Pro: cero colisiones, sin queries.
- Contra: opaco para humanos; anti-SEO ("/p/V1StGXR8_Z" no comunica nada).

### Opcion C — Slug = solo `id` numérico como string
- `slug = String(provider.id)`.
- Pro: trivial.
- Contra: pierde legibilidad; el SEO no se beneficia.

## Decision

Se elige **Opcion A**. Es la única opción que cumple "humano" (criterio explícito del nombre de la HU) y "mejorar SEO" (criterio de aceptación). El helper `slugify` ya está disponible y tested. La deduplicación se hace en un loop con `MAX_ATTEMPTS=10` para evitar loops infinitos en casos patológicos.

## Riesgos y mitigaciones

- Riesgo: el slug generado contiene palabras vacías que el visitante espera ("de", "la") → Mitigación: aceptable; `slugify` los preserva como separadores. Si se quiere limpiar, REQ futuro.
- Riesgo: cambio de slug al editar oficio/comuna genera 404 en enlaces externos → Mitigación: el slug se genera UNA vez al crear el perfil; ediciones posteriores NO regeneran. Documentar en PR.
- Riesgo: dos prestadores diferentes con mismo nombre+oficio+comuna → Mitigación: el loop de deduplicación prueba sufijos `-2`, `-3`, etc. hasta `MAX_ATTEMPTS=10`.
- Riesgo: redirect 301 sin caché genera tormenta de hits al endpoint → Mitigación: 301 con `Cache-Control: public, max-age=86400` (1 día); cambios de slug son raros.

## Metrica de exito

- Crear prestador "Juan Pérez", gasfiter, Las Condes → `slug = "juan-perez-gasfiter-las-condes"`.
- Crear otro con mismos datos → `slug = "juan-perez-gasfiter-las-condes-2"`.
- `curl /profile?id=42 -I` (provider con id=42 y slug="juan-...-las-condes") → `301 Location: /p/juan-perez-gasfiter-las-condes`.
- `curl /profile?id=99999 -I` (provider inexistente) → 404 (no redirect a slug vacío).
- La migración aplica en D1 local sin errores; insertar dos providers con mismo slug falla con UNIQUE.
