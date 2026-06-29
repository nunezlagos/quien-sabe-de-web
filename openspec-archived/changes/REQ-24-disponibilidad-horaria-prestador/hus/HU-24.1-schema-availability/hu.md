# HU-24.1 — Esquema provider_availability

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Historia de usuario

**Como** plataforma
**Quiero** modelar disponibilidad semanal de prestadores
**Para** habilitar filtros y badges

## Criterios de aceptación (Gherkin)

### Escenario: Tabla creada
  Cuando aplico migración
  Entonces existe `provider_availability (provider_id, day_of_week 0-6, start_time, end_time)`
  Y UNIQUE `(provider_id, day_of_week, start_time)` previene duplicados

### Escenario: CHECK end > start
  Cuando intento insertar `{day:1, start:"14:00", end:"09:00"}`
  Entonces la restricción falla (CHECK SQL o validación servicio)

### Escenario: Múltiples rangos por día permitidos
  Cuando inserto `{day:1, 09:00-13:00}` y `{day:1, 15:00-19:00}`
  Entonces ambos coexisten

### Escenario: Tipo time como TEXT HH:MM
  Cuando consulto schema
  Entonces start_time/end_time son TEXT con formato `HH:MM` (compatible D1/SQLite)

## Tareas técnicas

- [ ] Modificar `src/database/schema.ts` agregando `providerAvailability`
- [ ] Migración Drizzle `src/database/migrations/`
- [ ] Validador Zod `AvailabilityRange` con regex HH:MM y `end>start`
- [ ] Tests `tests/unit/availability/schema.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
