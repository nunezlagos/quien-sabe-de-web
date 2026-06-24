# HU-24.3 — Badge 'Disponible ahora' en perfil público

**Estado:** planificada | **Prioridad:** P1 | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Historia de usuario

**Como** vecino
**Quiero** saber si el prestador está disponible ahora
**Para** contactarlo con confianza

## Criterios de aceptación (Gherkin)

### Escenario: Dentro de rango → badge verde
  Dado prestador con rango lunes 09-13 y `now=lunes 10:00 America/Santiago`
  Cuando renderizo `/p/:slug`
  Entonces aparece badge verde "Disponible ahora" en el header del perfil, junto al nombre (estilo `bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold` reusado de `mockups/profile.html:72-75`)

### Escenario: Fuera de rango → próxima ventana
  Dado `now=lunes 14:00` y rangos lunes 09-13 / martes 09-13
  Cuando renderizo
  Entonces badge gris "Próximo: martes 09:00"

### Escenario: Sin disponibilidad declarada
  Cuando prestador no tiene filas
  Entonces no se renderiza badge

### Escenario: Cálculo respeta zona horaria Chile
  Dado server UTC y `now=12:00 UTC`
  Cuando America/Santiago está en -4
  Entonces la hora local es 08:00 y se calcula correctamente

## Tareas técnicas

- [ ] Helper `isAvailableNow(ranges, now, tz)` en `src/lib/services/availability/now.ts`
- [ ] Helper `nextAvailable(ranges, now, tz)` para badge fallback
- [ ] Componente `<AvailabilityBadge />` en `src/components/availability/AvailabilityBadge.astro`
- [ ] Tests `tests/unit/availability/now.test.ts` con casos en límites

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
