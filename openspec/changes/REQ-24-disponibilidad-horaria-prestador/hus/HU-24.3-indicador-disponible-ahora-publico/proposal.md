# Propuesta — HU-24.3 — Badge 'Disponible ahora' en perfil público

**Estado:** propuesta | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Contexto

El visitante que llega a `/p/:slug` necesita saber de un vistazo si el prestador está disponible ahora mismo. Esta HU entrega el cálculo `isAvailableNow(ranges, now, tz)` con manejo correcto de timezone America/Santiago (UTC-3/-4 con horario de verano), un helper `nextAvailable(ranges, now, tz)` para el fallback cuando el prestador no está disponible pero tiene horario futuro, y un componente `<AvailabilityBadge>` con 3 estados (verde "Disponible ahora", gris "Próximo: X día HH:MM", ausente cuando no hay horario declarado).

## Mockups de referencia

- `mockups/profile.html:71-80` — header del perfil con badge placeholder "Disponible ahora" `bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold` con dot verde `w-2 h-2 rounded-full bg-green-500`. Variante gris mostrada en líneas 76-80.
- `mockups/dashboard-user.html:80` — patrón de badge `bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold` reutilizado.

## Alternativas consideradas

### Opción A — Cálculo server-side con helpers puros testeables
- `isAvailableNow(ranges: AvailabilityRange[], now: Date, tz: string): boolean` retorna true si el `now` (convertido a hora local Chile) cae dentro de algún rango del día correspondiente.
- `nextAvailable(ranges, now, tz)` itera rangos ordenados buscando el primero cuyo inicio sea > hora local.
- Pro: funciones puras, testeables unitariamente sin DB.
- Pro: la UI sólo lee `is_available_now: boolean` y `next_available: { day, time } | null` calculado en SSR.
- Contra: requiere tests cuidadosos con DST (horario de verano Chile cambia en septiembre/marzo aprox).

### Opción B — Cálculo client-side con JS nativo
- Pro: cero lógica server.
- Contra: el badge debe aparecer server-rendered para SEO y performance; client-side introduce flicker.

### Opción C — Cachear `is_available_now` en DB con job que actualiza cada minuto
- Pro: queries rápidas.
- Contra: introduce lag de hasta 1 minuto; complejidad operacional.

## Decisión

Se elige **Opción A**. Funciones puras testeables con casos límite (DST, medianoche, cruces de día). El SSR del perfil público calcula ambos helpers y los pasa al componente badge.

## Riesgos y mitigaciones

- Riesgo: DST en Chile (segundo sábado de septiembre al primer sábado de abril) → Mitigación: usar `Intl.DateTimeFormat` con `timeZone: 'America/Santiago'` para conversión; tests cubren ambos extremos del año.
- Riesgo: `Intl.DateTimeFormat` con timezone en runtime de Cloudflare Workers tiene comportamiento estable pero documentado → Mitigación: aceptar el comportamiento estándar; tests verifican que `tz='America/Santiago'` con `now=2026-06-15T20:00:00Z` retorna hora local `17:00`.
- Riesgo: cuando el prestador está disponible justo en el límite del rango (ej. 13:00:00 exacto) → Mitigación: el cálculo usa `<` estricto para `end_time`, así 13:00:00 NO está disponible. Documentar convención.

## Métrica de éxito

- Test unit: `isAvailableNow([{day:1, 09:00-13:00}], new Date('2026-06-15T13:00:00Z'), 'America/Santiago')` con hora local resultante 10:00 → true.
- Test unit: con hora local 14:00 → false.
- Test unit: `nextAvailable([{day:1, 09:00-13:00}, {day:2, 09:00-13:00}], now=lunes 14:00, tz)` → `{day:2, time: '09:00'}`.
- E2E: `/p/juan-perez` con fixture lunes 10:00 hora Chile → badge verde "Disponible ahora". Mismo perfil con lunes 14:00 → badge gris "Próximo: martes 09:00".
- Sabotaje: en `isAvailableNow`, usar `<=` en vez de `<` para end_time → prestador sigue "disponible" un segundo más allá del cierre → test con hora local exacta = end_time verifica false → restaurar.