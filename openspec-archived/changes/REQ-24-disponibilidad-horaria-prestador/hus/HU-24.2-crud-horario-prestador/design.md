# Diseño técnico — HU-24.2 — CRUD horario semanal del prestador

**REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Modelo de datos

Reutiliza `provider_availability` (HU-24.1). Esta HU no introduce tablas.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/providers/me/availability` | GET | sesión prestador | — | `AvailabilityRange[]` | 401, 403 |
| `/api/v1/providers/me/availability` | PUT | sesión prestador | `AvailabilityRange[]` | `AvailabilityRange[]` (estado final) | 400 (body inválido), 401, 403, 422 (solapamiento) |
| `/api/v1/providers/:id/availability` | GET | público | — | `AvailabilityRange[]` | 404 (provider no existe) |

`AvailabilityRange = { day_of_week: number 0-6, start_time: 'HH:MM', end_time: 'HH:MM' }`

## Validaciones Zod

Reuso de `availabilityArraySchema` de HU-24.1. Adicional:

```ts
// src/lib/services/availability/validate.ts
export function validateNoOverlap(ranges: AvailabilityRange[]): void {
  const byDay = new Map<number, AvailabilityRange[]>()
  for (const r of ranges) {
    if (!byDay.has(r.day_of_week)) byDay.set(r.day_of_week, [])
    byDay.get(r.day_of_week)!.push(r)
  }
  for (const [day, dayRanges] of byDay) {
    dayRanges.sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (let i = 1; i < dayRanges.length; i++) {
      if (dayRanges[i].start_time < dayRanges[i - 1].end_time) {
        throw new OverlapError(`rangos solapados día ${day}`)
      }
    }
  }
}
```

## Componentes UI

### Endpoints
- `src/pages/api/v1/providers/me/availability.ts` con handlers `GET` y `PUT`.
- `src/pages/api/v1/providers/[id]/availability.ts` con handler `GET` (público, lectura del perfil).

### Vista dashboard
- En `src/pages/dashboard-provider.astro` (REQ-12), agregar card "Mi Horario de Atención" basada en `mockups/dashboard-provider.html:229-352`.
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`.
- Por cada día (0-6, empezar lunes según mockup): un card con:
  - Label "Lunes" + toggle (input `type="checkbox"` con `sr-only peer`).
  - Si toggle ON: 2 inputs `type="time"` (start, end) + botón "+ Otro rango".
  - Si toggle OFF: texto "Cerrado".
- Botón "Guardar horarios" al pie del card → PUT al endpoint.

### Componente
- `src/components/availability/WeeklyScheduleGrid.astro` con prop `{ initialRanges: AvailabilityRange[] }`.
- Isla `client:load` para gestionar estado de toggles, agregar rangos y submit PUT.
- Reusa estilos del mockup sin cambios.

## Flujo de interacción (secuencial)

### GET propio
1. Prestador autenticado navega a `/dashboard-provider`.
2. SSR llama `getProviderAvailability(env, session.providerId)` y la pasa al componente.
3. Renderiza el grid con los rangos actuales.

### PUT (save)
1. Prestador edita los toggles/horarios en el cliente.
2. Click "Guardar horarios" → cliente construye array y envía PUT.
3. Backend: `requireRole('prestador')` → 401/403.
4. `availabilityArraySchema.parse(body)` → 400 si falla.
5. `validateNoOverlap(ranges)` → 422 si hay solapamiento.
6. `db.batch([DELETE WHERE provider_id = ?, INSERT ...])` atómico.
7. Responde 200 con el array final.

### GET público
1. Visitante anónimo navega a `/p/juan-perez` (REQ-07).
2. SSR llama `getProviderAvailability(env, providerId)` y la pasa al `AvailabilityBadge` (HU-24.3).

## Capa de servicios

`src/lib/services/availability/crud.ts`:
- `getProviderAvailability(env, providerId): Promise<AvailabilityRange[]>`.
- `replaceProviderAvailability(env, providerId, ranges): Promise<AvailabilityRange[]>` — DELETE + INSERT atómico en batch.

`src/lib/services/availability/validate.ts`:
- `validateNoOverlap(ranges)` — helper exportado.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/services/validate-overlap.test.ts` — `validateNoOverlap` acepta rangos no solapados; rechaza solapamiento mismo día; permite solapamiento entre días distintos. |
| Integración | `tests/integration/availability/crud.test.ts` — PUT con 3 rangos válidos inserta y borra los anteriores; PUT con solapamiento devuelve 422; GET propio con sesión prestador devuelve array actual; GET público sin sesión funciona; PUT sin sesión devuelve 401; transacción rollback si INSERT 3 falla. |
| E2E | `tests/e2e/provider-schedule.spec.ts` (Playwright) — login prestador → /dashboard-provider → ve 7 cards con toggles → toggle lunes ON, llenar 09:00-13:00 → click "Guardar horarios" → ver toast verde → reload mantiene el rango. |

## Dependencias y secuencia

- **Bloqueado por:** HU-24.1 (schema), REQ-04 (tabla providers), REQ-21 (rol prestador activo).
- **Bloquea a:** HU-24.3 (badge público consume `getProviderAvailability`), HU-24.4 (filtro search consume la misma query), HU-24.5 (toggle).
- **Recursos compartidos:** `src/lib/validators/availability.ts`, `src/components/availability/`.

## Riesgos técnicos

- Riesgo: el componente `<WeeklyScheduleGrid>` con `client:load` agrega ~5KB de JS al dashboard → Mitigación: aceptable para un dashboard que el prestador visita para editar; alternativas (Astro server actions) son más invasivas.
- Riesgo: timezone del browser del prestador puede diferir de America/Santiago → Mitigación: el backend siempre interpreta los rangos como hora local Chile; el cálculo de "disponible ahora" (HU-24.3) hace la conversión explícita.
- Riesgo: PUT masivo con muchos rangos puede ser lento → Mitigación: tope de 50 rangos por provider (ya validado en `availabilityArraySchema.max(50)`).