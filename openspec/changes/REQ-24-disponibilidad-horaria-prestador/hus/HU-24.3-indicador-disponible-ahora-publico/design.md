# Diseño técnico — HU-24.3 — Badge 'Disponible ahora' en perfil público

**REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Modelo de datos

No introduce tablas. Lee de `provider_availability` (HU-24.1).

## Contrato de API

Consumido, no definido:
- `GET /api/v1/providers/:id/availability` (HU-24.2) devuelve `AvailabilityRange[]`.

Salida esperada en `/p/:slug` (REQ-07): el SSR recibe `provider` + `availability: AvailabilityRange[]` y calcula `isAvailableNow` + `nextAvailable` antes de renderizar.

## Validaciones Zod

No aplica (helpers puros sin input externo más allá de `Date` y rangos ya validados).

## Componentes UI

### Componente Astro
- `src/components/availability/AvailabilityBadge.astro` con props `{ ranges: AvailabilityRange[], now?: Date }` (default `now = new Date()`).
- Cálculo interno:
  - `const tz = 'America/Santiago'`
  - `const local = formatInTimeZone(now, tz, 'EEE HH:mm')` → "Mon 10:00"
  - `const isAvailable = isAvailableNow(ranges, now, tz)`
  - Si `isAvailable`:
    ```astro
    <span class="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold" role="status">
      <span class="w-2 h-2 rounded-full bg-green-500"></span>
      Disponible ahora
    </span>
    ```
  - Si no `isAvailable` y `next`:
    ```astro
    <span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[11px] font-bold">
      <i class="ri-time-line"></i>
      Próx. disponibilidad: {nextDayLabel} {next.time}
    </span>
    ```
  - Si no hay rangos: retorna `null` (no renderiza).

### Integración en `/p/[slug].astro`
- Después del badge "Verificado" (REQ-07), insertar `<AvailabilityBadge ranges={availability} />`.

### Helpers
- `src/lib/services/availability/now.ts`:
  ```ts
  import { formatInTimeZone } from 'date-fns-tz'  // o usar Intl.DateTimeFormat nativo

  export function getLocalHourAndDay(now: Date, tz: string): { dayOfWeek: number, hhmm: string } {
    const localStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(now)
    // Parse "Mon 10:00" → dayOfWeek=1 (sql convention: 0=domingo), hhmm="10:00"
    // ...
  }

  export function isAvailableNow(ranges: AvailabilityRange[], now: Date, tz: string): boolean {
    const { dayOfWeek, hhmm } = getLocalHourAndDay(now, tz)
    return ranges.some(r => r.day_of_week === dayOfWeek && r.start_time <= hhmm && hhmm < r.end_time)
  }

  export function nextAvailable(ranges: AvailabilityRange[], now: Date, tz: string): { day_of_week: number, time: string, dayLabel: string } | null {
    const { dayOfWeek, hhmm } = getLocalHourAndDay(now, tz)
    const sorted = [...ranges].sort((a, b) => {
      const dayDelta = ((a.day_of_week - dayOfWeek) + 7) % 7
      const dayDeltaB = ((b.day_of_week - dayOfWeek) + 7) % 7
      if (dayDelta !== dayDeltaB) return dayDelta - dayDeltaB
      return a.start_time.localeCompare(b.start_time)
    })
    for (const r of sorted) {
      const dayDelta = ((r.day_of_week - dayOfWeek) + 7) % 7
      if (dayDelta === 0 && r.start_time <= hhmm) continue
      return { day_of_week: r.day_of_week, time: r.start_time, dayLabel: DAY_LABELS[r.day_of_week] }
    }
    return null
  }
  ```

## Flujo de interacción (secuencial)

1. Visitante navega a `/p/juan-perez`.
2. SSR (REQ-07) consulta `provider` + `getProviderAvailability(env, providerId)`.
3. Renderiza `<AvailabilityBadge ranges={availability} />`.
4. El componente calcula `isAvailable` con `now = new Date()` en server; el HTML ya llega con el badge correcto.

## Capa de servicios

`src/lib/services/availability/now.ts` — helpers puros, sin I/O, fáciles de testear.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/availability/now.test.ts` — `isAvailableNow` con ranges `[{day:1, 09:00-13:00}]`: `now=lunes 10:00 Chile` → true; `now=lunes 13:00` (exacto) → false (límite estricto); `now=lunes 08:59` → false; `now=martes 10:00` → false (rango no aplica). `nextAvailable` con `[{day:1, 09:00-13:00}, {day:2, 09:00-13:00}]` y `now=lunes 14:00` → `{day:2, time:'09:00', dayLabel:'martes'}`; con `now=lunes 10:00` (dentro del rango) → siguiente día martes 09:00; sin rangos futuros → null. |
| Integración | `tests/integration/availability/badge.test.ts` — SSR de `/p/juan-perez` con fixture lunes 10:00 Chile: HTML contiene badge verde; con fixture lunes 14:00: HTML contiene badge gris "martes 09:00"; sin availability: HTML NO contiene badge. |
| E2E | `tests/e2e/profile-availability.spec.ts` (Playwright) — navegar a perfil con horario lunes 9-13, mockear `Date.now` a lunes 10:00 → ver badge verde; mockear a lunes 14:00 → ver badge gris. |

## Dependencias y secuencia

- **Bloqueado por:** HU-24.1 (schema), HU-24.2 (endpoint público para SSR), REQ-07 (vista `/p/[slug]`).
- **Bloquea a:** HU-24.4 (filtro "disponible ahora" en buscador reusa `isAvailableNow`), HU-24.5 (toggle off fuerza no disponible, integrado en `isAvailableNow`).
- **Recursos compartidos:** `src/lib/services/availability/`, `src/components/availability/`.

## Riesgos técnicos

- Riesgo: el SSR usa `Date.now()` para el cálculo, así que el badge cambia por request → Mitigación: cachear la página 60s (ya estándar) y aceptar el lag. Documentar en README que el badge puede tener hasta 60s de stale.
- Riesgo: el cálculo en `Intl.DateTimeFormat` con timezone `America/Santiago` puede ser costoso en SSR → Mitigación: el cálculo es 1 llamada por request; aceptable.
- Riesgo: tests con `Date` fija requieren mock o usar `new Date('YYYY-MM-DDTHH:mm:ssZ')` con offset Chile → Mitigación: usar fechas con offset UTC explícito y verificar el resultado local.