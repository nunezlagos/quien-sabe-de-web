# HU-24.3 — Badge 'Disponible ahora' en perfil público

**Estado:** planned → ready
**Prioridad:** P1
**REQ padre:** REQ-24-disponibilidad-horaria-prestador
**Rama:** `feat/HU-24.3-indicador-disponible-ahora-publico`

## Tareas técnicas

- [ ] **T1** Helper `getLocalHourAndDay(now: Date, tz: string)` en `src/lib/services/availability/now.ts` usando `Intl.DateTimeFormat` con `timeZone: 'America/Santiago'`, `weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false`. Retorna `{dayOfWeek: 0-6 sql convention, hhmm: 'HH:MM'}`.
- [ ] **T2** Función pura `isAvailableNow(ranges, now, tz)` en `src/lib/services/availability/now.ts`:
  - Calcula `{dayOfWeek, hhmm}`.
  - Retorna `true` si algún range tiene `r.dayOfWeek === dayOfWeek && r.start_time <= hhmm && hhmm < r.end_time`.
- [ ] **T3** Función pura `nextAvailable(ranges, now, tz)` en `src/lib/services/availability/now.ts`:
  - Ordena rangos por días desde hoy (incluyendo hoy si aún no comenzó).
  - Retorna `{day_of_week, time, dayLabel}` del próximo rango futuro, o `null`.
- [ ] **T4** Constantes `DAY_LABELS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']`.
- [ ] **T5** Componente `src/components/availability/AvailabilityBadge.astro` con prop `{ ranges: AvailabilityRange[], now?: Date }`. Renderiza uno de 3 estados:
  - Disponible (verde con dot `bg-green-500`).
  - Próximo (gris con icono `ri-time-line`).
  - Sin rangos → `null`.
- [ ] **T6** Insertar `<AvailabilityBadge>` en `src/pages/p/[slug].astro` (REQ-07) después del badge "Verificado".
- [ ] **T7] Tests:
  - [ ] `tests/unit/availability/now.test.ts` — `getLocalHourAndDay` con `new Date('2026-06-15T13:00:00Z')` y tz `America/Santiago` (UTC-4 en junio) retorna `dayOfWeek=1, hhmm='09:00'`. `isAvailableNow` con `[{day:1, 09:00-13:00}]`: lunes 10:00 → true; lunes 13:00 exacto → false; lunes 08:59 → false; martes 10:00 → false. `nextAvailable` con `[{day:1, 09-13}, {day:2, 09-13}]` y lunes 14:00 → `{day_of_week:2, time:'09:00', dayLabel:'martes'}`; sin rangos futuros → null.
  - [ ] `tests/integration/availability/badge.test.ts` — SSR de `/p/juan-perez` con mock Date lunes 10:00 y fixture 1 rango lunes 09-13: HTML contiene `bg-green-100 text-green-700`; mock Date lunes 14:00: HTML contiene `bg-gray-100 text-gray-600` y texto "martes 09:00"; fixture sin availability: HTML NO contiene badge.
  - [ ] Sabotaje 1: en `isAvailableNow`, cambiar `<` por `<=` para `hhmm < r.end_time` → lunes 13:00 exacto retorna true → test verifica que con hora exacta = end_time retorna false → restaurar.
  - [ ] Sabotaje 2: en `nextAvailable`, olvidar el filtro `r.start_time <= hhmm` en día actual → sugiere "ahora mismo" como próximo → test con lunes 10:00 dentro de rango retorna `null` (no hay próximo) → restaurar.
  - [ ] Sabotaje 3: en `getLocalHourAndDay`, hardcodear offset fijo `-3` (no respeta DST) → en invierno Chile usa -3, en verano -4 → test con fecha de invierno vs verano verifica diferencia → restaurar.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde (con mock de tiempo)
- [ ] Sabotaje confirmado: los 3 sabotajes documentados ejecutados → test rojo verificable → restaurados
- [ ] Coverage ≥ 90 % en `src/lib/services/availability/now.ts`
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] Commit con `feat: badge disponible ahora en perfil público` y push a rama (no merge a main)