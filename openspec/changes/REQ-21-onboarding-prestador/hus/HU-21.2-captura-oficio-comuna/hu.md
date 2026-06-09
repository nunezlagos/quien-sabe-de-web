# HU-21.2 — Selector de oficio y multi-comuna

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** prestador
**Quiero** elegir mi oficio y las comunas que cubro
**Para** que los vecinos cercanos me encuentren

## Criterios de aceptación (Gherkin)

### Escenario: Catálogo de oficios poblado dinámicamente
  Cuando el wizard se carga
  Entonces el `<select>` (`mockups/create-trade.html:62`) se popula desde `GET /api/v1/catalog/trades`
  Y la lista coincide con `tradesList` de `mockups/js/data.js:2-10` (Gasfiter, Electricista, Maestro, Jardinero, Programador, Pintor, Costurera)

### Escenario: Multi-select de comunas
  Cuando expongo selector de cobertura (nueva sección entre bloque 1 y 2 del mockup)
  Entonces puedo elegir varias comunas de `communesList` (`js/data.js:12-16`)
  Y al menos 1 comuna es requerida

### Escenario: Oficio "Otro" habilita free-text
  Cuando elijo "Otro" (`create-trade.html:69`)
  Entonces se muestra input adicional con label "Especifica tu oficio"
  Y el valor queda pendiente de aprobación admin (`trades.status="pending"`)

### Escenario: Submit persiste cobertura
  Cuando envío el form con 3 comunas
  Entonces se crean 3 filas en `provider_communes`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/catalog/trades.ts` (GET público)
- [ ] Endpoint `src/pages/api/v1/catalog/communes.ts` (GET público)
- [ ] Componente `<MultiCommuneSelector />` en `src/components/onboarding/MultiCommuneSelector.astro`
- [ ] Seed Drizzle `src/database/seeds/trades.ts` con la lista de `mockups/js/data.js:2-10`
- [ ] Seed `src/database/seeds/communes.ts` con `mockups/js/data.js:12-16`
- [ ] Tabla Drizzle `provider_communes` en `src/database/schema.ts`
- [ ] Tests `tests/integration/catalog/trades.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
