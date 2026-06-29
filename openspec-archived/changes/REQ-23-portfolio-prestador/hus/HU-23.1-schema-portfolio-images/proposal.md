# Propuesta — HU-23.1 — Esquema portfolio_images con límite 5

**Estado:** propuesta | **REQ padre:** REQ-23-portfolio-prestador

## Contexto

El prestador necesita persistir hasta 5 fotos por perfil para alimentar la galería pública (OE1: confianza y credibilidad del prestador). Hoy el mockup usa un array hardcodeado `portfolio: ["url1", ...]` en `mockups/js/data.js:36-40`; falta una tabla D1 con orden estable y vínculo al prestador para poder gestionar reorden y borrado consistente desde dashboard.

## Mockups de referencia

- `mockups/js/data.js:36-40` — modelo de datos actual (array de URLs simple), referencia para el shape mínimo a migrar a D1.
- `mockups/dashboard-provider.html:155` — texto "Máx. 5 fotos" que establece el límite de UI a enforzar en backend.
- `mockups/dashboard-provider.html:158` — `grid grid-cols-2 md:grid-cols-5 gap-3` confirma 5 slots fijos.

## Alternativas consideradas

### Opción A — Tabla `portfolio_images` con `sort_order` entero y UNIQUE compuesto
- Descripción: una fila por imagen, columna `sort_order` 0..4, UNIQUE `(provider_id, sort_order)`.
- Pro: reorden y borrado triviales, orden estable, fácil de seedear.
- Contra: requiere compactar `sort_order` al borrar para no dejar huecos (lógica en servicio).

### Opción B — Columna JSON `portfolio_urls` en `providers`
- Descripción: array de URLs serializado dentro de la fila del prestador.
- Pro: una sola query, no requiere joins.
- Contra: D1 no indexa JSON, reorden = reescritura completa, no se puede referenciar imágenes individualmente desde otras tablas (REQ-07, cleanup R2 por imagen).

### Opción C — Tabla `portfolio_images` con `position` flotante estilo LiveOrder
- Descripción: usar números fraccionarios para reordenar sin reescribir.
- Pro: reorden sin tocar otras filas.
- Contra: complejidad innecesaria para un máximo de 5 filas; tradeoff sólo justificable en listas largas.

## Decisión

Se adopta la **Opción A**. Para 5 elementos como máximo el costo de compactar `sort_order` es despreciable y el UNIQUE compuesto garantiza orden determinístico. SQLite no soporta CHECK con subconsulta `COUNT`, así que el límite de 5 se enforza en código (servicio `assertPortfolioCapacity`).

## Riesgos y mitigaciones

- Riesgo: borrado deja huecos en `sort_order` rompiendo UNIQUE al reinsertar → mitigación: helper `compactSortOrder(providerId)` corre dentro de la misma transacción del DELETE.
- Riesgo: race condition entre dos uploads concurrentes asignando mismo `sort_order` → mitigación: transacción `BEGIN IMMEDIATE` en `upload.ts` cubriendo lectura del max + insert.
- Riesgo: borrado de prestador deja filas huérfanas con archivos en R2 → mitigación: cascade lógico vía job de cleanup (REQ-22) que lee filas marcadas y elimina objetos R2.

## Métrica de éxito

- Migración aplicada en dev y en CI sin errores.
- Test unitario confirma que `assertPortfolioCapacity` rechaza el 6º insert.
- Seed de tests reproduce exactamente la cantidad de elementos del array de `mockups/js/data.js:36-40` para fixtures.
