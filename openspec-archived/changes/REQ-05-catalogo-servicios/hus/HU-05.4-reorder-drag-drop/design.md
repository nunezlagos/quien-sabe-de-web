# Diseno tecnico — HU-05.4 — Reordenar servicios con drag and drop

**REQ padre:** REQ-05-catalogo-servicios

## Modelo de datos

No agrega tablas. Sólo actualiza `services.sort_order` (de HU-05.1).

## Contrato de API

### `POST /api/v1/providers/me/services/reorder`

**Request body**
```ts
{
  order: z.array(z.number().int().positive()).min(1)
}
```

**Validaciones del handler**
- `order` es un array con IDs únicos.
- Longitud del array === cantidad de servicios del prestador (todos los `services WHERE provider_id = ? AND status != 'deleted'`).
- Todos los IDs del array son del prestador (subquery: `SELECT COUNT(*) FROM services WHERE id IN (...) AND provider_id = ?`).

**Response 200**
```json
{ "ok": true, "items": [{ "id": 9, "sort_order": 0 }, { "id": 7, "sort_order": 1 }, { "id": 8, "sort_order": 2 }] }
```

**Errores**
- 422 `{ error: "debe incluir todos los servicios" }` si longitud no coincide.
- 403 `{ error: "ids ajenos detectados" }` si hay IDs de otro prestador.
- 404 si el prestador no tiene perfil.

## Validaciones Zod

```ts
// src/lib/validators/services.ts (extiende HU-05.2)
export const serviceReorderSchema = z.object({
  order: z.array(z.number().int().positive()).min(1).max(200),
})
```

## Componentes UI

- `src/components/dashboard/provider/ServicesList.astro` — wrapper.
- `src/components/dashboard/provider/SortableServiceItem.astro` — item con:
  - `data-service-id` para drag-drop.
  - `<button aria-label="Mover arriba">` y `<button aria-label="Mover abajo">` para accesibilidad con teclado.
  - `<span class="ri-drag-move-2-line" aria-hidden="true">` como handle visual.
- Lógica cliente: usa `SortableJS` (a confirmar en implementación) o `@atlaskit/pragmatic-drag-drop`. Mantiene orden en estado; al confirmar ("Guardar orden"), hace POST a `/reorder`.

## Flujo de interaccion (secuencial)

1. Prestador entra a `/dashboard-provider` → sección "Mis Servicios Activos".
2. GET `/api/v1/providers/me/services` → renderiza la lista en orden actual.
3. Prestador arrastra items o usa flechas.
4. Front mantiene el orden en estado local.
5. Click en "Guardar orden" → POST `/api/v1/providers/me/services/reorder` con `{"order": [ids en nuevo orden]}`.
6. Handler valida (Zod + ownership + completitud).
7. Si OK → `db.transaction` con N updates: `UPDATE services SET sort_order = ? WHERE id = ? AND provider_id = ?`.
8. Devuelve 200 con los nuevos `sort_order`.
9. Front refresca el estado y muestra mensaje "Orden guardado".

## Capa de servicios

- `src/lib/services/services.ts` (extiende):
  - `reorderServices(db, providerId, newOrder: number[]): Promise<void>` — transacción con N updates.
  - `getServicesByProvider` (existente, HU-05.2) — usado para validar completitud.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/services.test.ts` (extiende) | `serviceReorderSchema` rechaza array vacío, IDs negativos, duplicados |
| Integracion | `tests/integration/services/reorder.test.ts` | Happy path 3 servicios; id ajeno 403; array incompleto 422; idempotencia (mismo orden 2 veces → no rompe) |
| E2E | `tests/e2e/services-reorder.spec.ts` | Playwright drag-drop en `/dashboard-provider`; verificar persistencia tras reload |

## Dependencias y secuencia

- **Bloqueado por:** HU-05.2 (servicios CRUD), HU-04.2 (sesión y perfil).
- **Bloquea a:** HU-12 (dashboard prestador completo), HU-06.x (la búsqueda puede ordenar por `sort_order`).
- **Recursos compartidos:** `db.transaction`, `Astro.locals.session`.

## Riesgos tecnicos

- Riesgo: N updates dentro de transacción con N=50 → latencia → Mitigación: D1 maneja esto en <100 ms típicamente; bench HU-06.7.
- Riesgo: drag-drop library no soporta teclado → Mitigación: fallback con flechas; verificación manual y automated con Playwright `keyboard.press`.
- Riesgo: la transacción UPDATE compite con INSERTs concurrentes del mismo prestador → Mitigación: `BEGIN IMMEDIATE` en SQLite evita race; documentado en servicio.
