# HU-24.2 — CRUD horario semanal del prestador

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-24-disponibilidad-horaria-prestador

## Historia de usuario

**Como** prestador
**Quiero** declarar mis horarios semanales
**Para** que los vecinos sepan cuándo estoy disponible

## Criterios de aceptación (Gherkin)

### Escenario: PUT reemplaza el horario completo
  Cuando envío `PUT /api/v1/providers/me/availability` con array de rangos
  Entonces recibo status 200
  Y la tabla queda con exactamente esos rangos (delete + insert atómico)

### Escenario: Solapamiento detectado → 422
  Cuando envío `[{day:1,09-12},{day:1,11-13}]`
  Entonces recibo status 422 con `{ "error": "rangos solapados día 1" }`

### Escenario: UI dashboard refleja estado
  Cuando navego a `/dashboard-provider` sección Disponibilidad (mockup pendiente, estilo reutilizando card `bg-white rounded-3xl shadow-sm border border-gray-100 p-8` de `mockups/dashboard-provider.html:135`)
  Entonces veo grid semanal con 7 columnas y mis rangos pintados

### Escenario: GET público
  Cuando consulto `GET /api/v1/providers/42/availability`
  Entonces recibo lista de rangos (sin info sensible)

## Tareas técnicas

- [ ] Endpoints `src/pages/api/v1/providers/me/availability.ts` (GET, PUT)
- [ ] Endpoint público `src/pages/api/v1/providers/[id]/availability.ts` (GET)
- [ ] Validador `validateNoOverlap(ranges)` en `src/lib/services/availability/validate.ts`
- [ ] Componente `<AvailabilityGrid editable />` (requiere mockup nuevo previo)
- [ ] Tests `tests/integration/availability/crud.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
