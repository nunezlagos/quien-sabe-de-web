# HU-21.2 — Selector de oficio y multi-comuna

**Estado:** implementada-mvp-parcial | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** prestador
**Quiero** elegir mi oficio y las comunas que cubro
**Para** que los vecinos cercanos me encuentren

## Criterios de aceptación (Gherkin)

### Escenario: Catálogo de oficios poblado
  Cuando el wizard se carga
  Entonces el `<select>` (`mockups/create-trade.html:62`) muestra: Gasfiter, Electricista, Jardinero, Maestro, Costurera, Otro
  Y la lista coincide con `OFICIOS_CONOCIDOS` en `src/lib/validators/trades.ts` *(MVP: lista hardcoded en el .astro, no dinámica desde `GET /api/v1/catalog/trades`)*

### Escenario: Multi-select de comunas
  Cuando expongo selector de cobertura
  Entonces puedo elegir varias comunas *(MVP: NO implementado — el wizard actual NO pide comuna, la cobertura se agregará cuando exista la tabla `provider_communes`)*

### Escenario: Oficio "Otro" habilita free-text
  Cuando elijo "Otro" (`create-trade.html:69`)
  Entonces se muestra input adicional con label "Especifica tu oficio" *(MVP: campo condicional con `data-oficio-otro` + `symbol_custom`)*
  Y el valor se almacena en `trades.symbol` *(MVP: el oficio "otro" con custom NO queda pendiente de aprobación admin — entra como activo)*

### Escenario: Submit persiste oficio
  Cuando envío el form con oficio seleccionado
  Entonces se crea 1 fila en `trades` con `symbol` correcto
  Y redirecciona a `/p/{slug}` *(MVP: ya implementado en `POST /api/v1/trades`)*

## Tareas técnicas

- [x] Lista de oficios en `src/lib/validators/trades.ts` (`OFICIOS_CONOCIDOS` tupla readonly) — commit `c80e62f`
- [x] Vista `src/pages/crear-oficio.astro` con 3 secciones (Básica / Contacto+Precio / Verificación) — commit `7414cfb`
- [x] Client logic para "Otro" → free-text en `src/lib/client/trades/crear-oficio.ts` — commit `7414cfb`
- [x] POST endpoint `/api/v1/trades` con schema Zod — commits `7414cfb`, `c80e62f`
- [x] 10 tests unit en `trades.test.ts` con sabotaje validado — commit `c80e62f`
- [ ] Endpoint `src/pages/api/v1/catalog/trades.ts` (GET público) *(pendiente — lista hardcoded en .astro)*
- [ ] Componente `<MultiCommuneSelector />` *(pendiente — wizard actual no pide comuna)*
- [ ] Tabla Drizzle `provider_communes` *(pendiente — no existe en schema)*
- [ ] Tests integration `tests/integration/catalog/trades.test.ts`

## Definition of done

- [x] Tests Vitest unit pasan (10 tests en `trades.test.ts`)
- [ ] Tests Vitest integración pasan *(bloqueado: better-sqlite3 sin bindings para Node 25)*
- [x] Test E2E Playwright manual pasa *(verificado: oficio "yesero" custom → POST → 302 → `/p/yesero-yesero-pedro-test`)*
- [x] Sabotaje confirmado: regex whatsapp relajado a `[0-9]{7,8}` → test cae → restaurado
- [ ] Coverage ≥ 90 %
- [ ] Type check verde
- [ ] PR mergeado

## Notas de implementación (commits `7414cfb`, `c80e62f`)

- **Decisión de scope**: el wizard MVP NO pide comuna (lo saqué del schema Zod en `12bfe86` para alinear con el mockup que tampoco la pide en la sección de oficio). El mockup `create-trade.html` tiene 3 secciones: Información Básica / Contacto+Precios / Verificación — sin comuna
- **Symbol derivado**: si NO se selecciona oficio o es "Otro" sin custom, el symbol se deriva del slug del nombre (`slugify(name).split('-')[0]`)
- **WhatsApp**: se almacena completo (569 + 8 dígitos del usuario)
- **Bug fix encontrado**: la página pública `/p/[slug]` tenía WhatsApp hardcodeado a `56912345678` — ahora usa `trade.whatsapp` real de la DB con fallback a hardcoded para oficios legacy
- **Path real**: `/crear-oficio` (español) — el archivo se llama `crear-oficio.astro`
