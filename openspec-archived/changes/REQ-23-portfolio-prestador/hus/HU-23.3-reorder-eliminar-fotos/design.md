# Diseño técnico — HU-23.3 — Reorder y eliminar fotos del portfolio

**REQ padre:** REQ-23-portfolio-prestador

## Modelo de datos

Reusa `portfolio_images` (HU-23.1). No agrega columnas. La invariante `UNIQUE (provider_id, sort_order)` se preserva mediante estrategia de doble pasada.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/portfolio/reorder` | PATCH | sesión prestador | `{ "order": number[] }` (ids del prestador, ≤ 5) | `200 { items: [{id, sortOrder}] }` | 400 (orden con ids duplicados o ajenos), 401, 403 (id no pertenece), 422 (largo distinto al actual) |
| `/api/v1/providers/me/portfolio/:id` | DELETE | sesión prestador | — | `204 No Content` | 401, 403 (imagen de otro prestador), 404 (no existe), 500 (fallo R2) |

## Validaciones Zod

```ts
// src/lib/validators/portfolio.ts (pseudocódigo)
export const reorderPortfolioSchema // { order: number().int().positive().array().min(1).max(5) } con refine unique
export const imageIdParamSchema    // { id: coerce.number().int().positive() }
```

## Componentes UI

### Páginas Astro

- No introduce nuevas páginas. El cliente JS opera sobre la grilla dibujada por HU-23.5 en `src/pages/dashboard-provider.astro`.

### Componentes Astro reutilizables

- `src/components/portfolio/PortfolioGrid.astro` (definido en HU-23.5) recibe islas para drag-drop y delete.
- Mockup base: `mockups/dashboard-provider.html:158-186`.
- Islas requeridas: sí (interacción cliente, sin recarga).

## Flujo de interacción (secuencial)

### Eliminar
1. Prestador hace clic en `<i class="ri-delete-bin-line">` dentro de la card (`mockups/dashboard-provider.html:163`).
2. Cliente JS llama `deletePortfolioImage(id)` en `src/lib/client/portfolio.ts`.
3. Handler valida ownership; servicio borra R2; servicio borra fila D1; servicio invoca `compactSortOrder`.
4. Cliente recibe 204 y remueve la card del DOM sin recargar; añade un slot "Vacío" en su lugar siguiendo el estilo de `mockups/dashboard-provider.html:174-179`.

### Reordenar
1. Prestador arrastra una card (drag-drop sobre `grid grid-cols-2 md:grid-cols-5 gap-3`).
2. Cliente JS calcula array nuevo de ids y llama `reorderPortfolio([...])`.
3. Handler abre transacción D1: primera pasada `UPDATE sort_order = sort_order + 100 WHERE id IN (...)`, segunda pasada `UPDATE sort_order = <index>` para cada id en orden.
4. Cliente recibe 200 con orden final, reordena DOM localmente.

## Capa de servicios

- `src/lib/services/portfolio/reorder.ts`
  - `reorderPortfolio(db, providerId, orderedIds: number[]): Promise<Array<{id, sortOrder}>>`
- `src/lib/services/portfolio/delete.ts`
  - `deletePortfolioImage(db, bucket, providerId, imageId): Promise<void>`
- `src/lib/services/portfolio/limits.ts` — reusa `compactSortOrder` definido en HU-23.1.
- `src/lib/client/portfolio.ts`
  - `deletePortfolioImage(id): Promise<void>`
  - `reorderPortfolio(orderedIds: number[]): Promise<void>`
  - `uploadPortfolioImage(file): Promise<{id, url, sortOrder}>` (reusa endpoint de HU-23.2, definido aquí para que HU-23.5 lo consuma).

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/portfolio/reorder.test.ts` | Estrategia doble pasada no rompe UNIQUE |
| Integración | `tests/integration/portfolio/reorder-delete.test.ts` | DELETE elimina objeto R2 y compacta; reorder con `[42,12,33]` deja 0,1,2; 403 al tocar imagen ajena |
| E2E | `tests/e2e/dashboard-portfolio.spec.ts` | Clic en delete quita card del grid sin recarga |

## Dependencias y secuencia

- **Bloqueado por:** HU-23.1, HU-23.2.
- **Bloquea a:** HU-23.5 (la UI consume estos endpoints).
- **Recursos compartidos:** bindings `DB`, `BUCKET`, `SESSION`.

## Riesgos técnicos

- Riesgo: D1 no soporta transacciones interactivas largas → mitigación: usar `db.batch([...])` para encadenar updates en una sola roundtrip.
- Riesgo: drag-drop accesibilidad → mitigación: añadir botones "subir/bajar" como fallback teclado en HU-23.5.
- Riesgo: objeto R2 huérfano si crash entre delete R2 y delete D1 → mitigación: job de cleanup periódico (REQ-22) detecta y elimina filas marcadas; documentar en operación.
