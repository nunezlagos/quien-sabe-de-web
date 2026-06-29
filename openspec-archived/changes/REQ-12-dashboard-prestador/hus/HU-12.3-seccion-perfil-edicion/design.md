# Diseño técnico — HU-12.3 — Sección de edición de perfil inline

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

No introduce tablas nuevas. Lee/escribe `providers` y, si aplica, `provider_schedules` (heredados de REQ-04).

(No requiere migración Drizzle propia.)

## Contrato de API

Reuso de REQ-04. Sin endpoints nuevos en esta HU. Endpoints consumidos:

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me` | PATCH | sesión prestador | `{ name?, trade?, bio?, hourly_rate_clp? }` | `{ provider: { ... } }` | 400, 401, 403, 409 |
| `/api/v1/providers/me/avatar` | POST | sesión prestador | `multipart/form-data` (campo `file`) | `{ avatar_url: string }` | 400, 401, 413 |
| `/api/v1/providers/me/gallery` | POST | sesión prestador | `multipart/form-data` (campo `file`) | `{ image: { id, url } }` | 400, 401, 409 (>5) |
| `/api/v1/providers/me/gallery/:id` | DELETE | sesión prestador | (ninguno) | `204` | 401, 403, 404 |
| `/api/v1/providers/me/schedule` | PUT | sesión prestador | `{ days: [{ day, open, from, to }] }` | `{ schedule: { ... } }` | 400, 401 |

## Validaciones Zod

```ts
// src/lib/validators/provider-profile.ts (pseudocódigo, reuso REQ-04)
export const patchProviderSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  trade: z.enum(['Gasfiter', 'Electricista', 'Jardinero', 'Costurera', 'Maestro', 'Programador', 'Otro']).optional(),
  bio: z.string().max(2000).optional(),
  hourly_rate_clp: z.number().int().nonnegative().optional(),
})

export const scheduleSchema = z.object({
  days: z.array(z.object({
    day: z.enum(['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']),
    open: z.boolean(),
    from: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    to: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })).length(7),
})
```

## Componentes UI

### Páginas Astro

- Sin página nueva. Se monta como sección dentro de `src/pages/dashboard-provider.astro` (HU-12.1) bajo el anchor `#perfil`.

### Componentes Astro reutilizables

- `src/components/dashboard/provider/ProfileSection.astro` — props: `provider: ProviderFull`. Contiene banner de avatar + formulario.
  - Mockup base: `mockups/dashboard-provider.html:97-195`.
  - Islas requeridas: sí (`client:visible`) para submit, validación inline y toasts.
- `src/components/dashboard/provider/AvatarUploader.astro` — props: `currentAvatarUrl?: string`, `initials: string`. Renderiza círculo con preview/iniciales.
  - Mockup base: `mockups/dashboard-provider.html:101-110`.
  - Islas requeridas: sí (input file + preview).
- `src/components/dashboard/provider/GalleryEditor.astro` — props: `images: { id, url }[]`, `max: number = 5`.
  - Mockup base: `mockups/dashboard-provider.html:152-186`.
  - Islas requeridas: sí (upload + delete).
- `src/components/dashboard/provider/ScheduleEditor.astro` — props: `schedule: ScheduleByDay`.
  - Mockup base: `mockups/dashboard-provider.html:228-352`.
  - Islas requeridas: sí (toggles + time pickers).

## Flujo de interacción (secuencial)

1. Usuario navega a `/dashboard-provider#perfil` (link sidebar `mockups/dashboard-provider.html:59`).
2. `ProfileSection.astro` renderiza con los datos actuales del prestador.
3. Usuario edita biografía y/o oficio en el form (`mockups/dashboard-provider.html:129-149`).
4. Submit del botón "Guardar Cambios" (`mockups/dashboard-provider.html:189-193`) ejecuta validación Zod en cliente.
5. Isla envía `PATCH /api/v1/providers/me` con los campos modificados.
6. Servidor valida, persiste, y si cambió el oficio dispara el reindex (link REQ-04.5).
7. Respuesta 200 → toast "Perfil actualizado" + actualización optimista del rótulo `Juan Pérez / Gasfiter` (`mockups/dashboard-provider.html:114-116`).
8. Errores 400/409 → mensaje inline en el campo correspondiente.

## Capa de servicios

- `src/lib/services/provider-profile.service.ts`:
  - `patchProvider(env, providerId, patch): Promise<Provider>` — wrapper sobre Drizzle.
  - `triggerReindexIfTradeChanged(env, providerId, before, after): Promise<void>` — encola job o llama directo al índice (delegado a REQ-04.5).
  - `replaceSchedule(env, providerId, days): Promise<Schedule>`.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/provider-profile.test.ts` | Schema rechaza `hourly_rate_clp` negativo y `bio` > 2000. |
| Integración | `tests/integration/providers/patch-provider.test.ts` | PATCH persiste, cambio de oficio dispara reindex (mock), prestador no edita a otro. |
| E2E | `tests/e2e/provider-edit-profile.spec.ts` | Edita biografía → guarda → recarga → muestra cambio. Edita oficio → toast "indexando..." visible. |

## Dependencias y secuencia

- **Bloqueado por:** HU-12.1, REQ-04 (endpoints y validaciones base).
- **Bloquea a:** HU-12.7 (preview debe ver los cambios recién guardados).
- **Recursos compartidos:** binding `DB`, `BUCKET` (avatar y galería), índice de búsqueda (REQ-04.5).

## Riesgos técnicos

- Riesgo: race condition entre edición de form y carga de imagen. Mitigación: deshabilitar submit mientras hay uploads pendientes.
- Riesgo: tamaño de imagen excede límites. Mitigación: validar `Content-Length` y MIME en servidor antes de subir a `BUCKET`.
- Riesgo: rollback parcial si el reindex falla tras PATCH. Mitigación: reindex es best-effort con reintento; el dato canónico ya está en D1.
