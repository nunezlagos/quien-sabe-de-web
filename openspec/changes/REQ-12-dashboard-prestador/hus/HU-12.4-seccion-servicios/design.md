# Diseño técnico — HU-12.4 — Sección de gestión de servicios inline

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

Reuso de la tabla `services` definida en REQ-05.

```ts
// src/database/schema.ts (extracto referencial — definida en REQ-05)
export const services = sqliteTable('services', {
  // id, provider_id, name, price_clp, description, status: 'active' | 'inactive', created_at, updated_at
})
```

Si el campo `status` no existe aún, esta HU exige que esté presente.

### Migración Drizzle

- Si `services.status` no existe: archivo objetivo `src/database/migrations/NNNN_services_status.sql`.
- Cambios: añadir columna `status TEXT NOT NULL DEFAULT 'active'`.

## Contrato de API

Reuso de REQ-05.

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/services` | GET | sesión prestador | (ninguno) | `{ items: Service[] }` | 401, 403 |
| `/api/v1/providers/me/services` | POST | sesión prestador | `{ name, price_clp, description? }` | `{ service: Service }` (201) | 400, 401 |
| `/api/v1/providers/me/services/:id` | PATCH | sesión prestador | `{ name?, price_clp?, description?, status? }` | `{ service: Service }` | 400, 401, 403, 404 |
| `/api/v1/providers/me/services/:id` | DELETE | sesión prestador | (ninguno) | `204` | 401, 403, 404 |

## Validaciones Zod

```ts
// src/lib/validators/services.ts (pseudocódigo, reuso REQ-05)
export const serviceCreateSchema = z.object({
  name: z.string().min(2).max(120),
  price_clp: z.number().int().nonnegative(),
  description: z.string().max(500).optional(),
})

export const serviceUpdateSchema = serviceCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
})
```

## Componentes UI

### Páginas Astro

- Sin página nueva. Se monta como sección dentro de `src/pages/dashboard-provider.astro` (HU-12.1) bajo el anchor `#servicios`.

### Componentes Astro reutilizables

- `src/components/dashboard/provider/ServicesSection.astro` — props: `services: Service[]`. Renderiza header con CTA y la lista.
  - Mockup base: `mockups/dashboard-provider.html:198-226`.
  - Islas requeridas: sí (`client:visible`) para gatillar modal y refrescar lista.
- `src/components/dashboard/provider/ServiceItem.astro` — props: `service: Service`. Renderiza una fila con acciones.
  - Mockup base: `mockups/dashboard-provider.html:205-214`.
  - Islas requeridas: no.
- `src/components/dashboard/provider/ServiceModal.astro` — props: `mode: 'create' | 'edit'`, `service?: Service`.
  - Mockup base: `mockups/dashboard-provider.html:470-508`.
  - Islas requeridas: sí (form submit, validación).

## Flujo de interacción (secuencial)

1. Usuario navega a `#servicios` (link sidebar `mockups/dashboard-provider.html:60`).
2. `ServicesSection.astro` recibe SSR los servicios actuales (o los carga con `fetch` desde el endpoint GET).
3. Click en "Agregar Nuevo" (`mockups/dashboard-provider.html:201`) abre `ServiceModal` en modo `create` (`mockups/dashboard-provider.html:561-565`).
4. Submit del modal envía `POST /api/v1/providers/me/services`; en 201 se hace `prepend` a la lista.
5. Click en lápiz (`mockups/dashboard-provider.html:211`) abre `ServiceModal` en modo `edit` precargado.
6. Submit envía `PATCH .../:id`; en 200 reemplaza el ítem.
7. Click en basura (`mockups/dashboard-provider.html:212`) pide confirmación; envía `DELETE`; en 204 remueve el ítem.
8. Toggle de status activo/inactivo envía `PATCH .../:id` con `{ status }`; UI atenúa el ítem si `inactive`.

## Capa de servicios

- `src/lib/services/services.service.ts`:
  - `listServicesForProvider(env, providerId): Promise<Service[]>`
  - `createService(env, providerId, input): Promise<Service>`
  - `updateService(env, providerId, serviceId, patch): Promise<Service>` — verifica ownership.
  - `deleteService(env, providerId, serviceId): Promise<void>` — verifica ownership.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/services.test.ts` | Schemas rechazan precios negativos, nombres vacíos. |
| Integración | `tests/integration/providers/services-crud.test.ts` | CRUD completo; prestador A no puede tocar servicios de B. |
| E2E | `tests/e2e/provider-services-section.spec.ts` | Crear → ver en lista → editar → toggle inactivo → verificar atenuado → eliminar. |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1, REQ-05 (endpoints y tabla `services`).
- **Bloquea a:** HU-12.7 (preview debe reflejar servicios actualizados).
- **Recursos compartidos:** binding `DB`, modal único reutilizado para create/edit.

## Riesgos técnicos

- Riesgo: borrar servicio con dependencias (ej. reseñas que referencian su nombre). Mitigación: soft-delete o tombstone; en esta HU se asume hard delete simple.
- Riesgo: condición de carrera entre dos pestañas editando. Mitigación: usar `updated_at` como ETag opcional en una HU futura.
- Riesgo: precio sin formateador. Mitigación: helper compartido `formatCLP(amount)` ya usado en el resto del dashboard.
