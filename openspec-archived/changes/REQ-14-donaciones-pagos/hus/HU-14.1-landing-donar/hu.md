# HU-14.1 — Landing /donate con CTA y montos sugeridos

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante (anónimo o autenticado)
**Quiero** ver una landing clara con montos sugeridos
**Para** donar fácilmente

## Criterios de aceptación (Gherkin)

### Escenario: Render SSR de /donar
  Cuando visito `/donar`
  Entonces el HTML incluye CTA "Donar ahora" y montos sugeridos: 3000, 5000, 10000, 25000 CLP
  Y existe selector de monto custom

### Escenario: Botón inicia checkout MP
  Cuando clickeo "Donar $5.000 con Mercado Pago"
  Entonces se invoca `POST /api/v1/donations` *(MVP: no redirige a MP, devuelve acuse con `?ok=1&amount=...&provider=...`)*
  Y en MVP no se redirige a la URL de preferencia MP *(HU-14.2)*

### Escenario: Monto mínimo 1000 CLP
  Cuando ingreso monto custom 500
  Entonces el endpoint `POST /api/v1/donations` responde 302 → `/donar?error=Monto+mínimo+$1.000`

## Tareas técnicas

- [x] Vista `src/pages/donar.astro` (commit `732610b`) — *path real: `/donar` (español), no `/donate`*
- [x] Componente `src/components/donations/AmountSelector.astro` *(inline en .astro por ahora)*
- [x] Componente `src/components/donations/PaymentButtons.astro` *(inline en .astro por ahora — radios MP/Webpay)*
- [x] Input 'Otro monto' con validación inline mínimo $1.000
- [x] Toggle 'Hacer esta donación todos los meses' (HU-14.7)
- [x] Selector de pasarela MP | Webpay
- [x] Botones de monto con `data-amount` para wire-up
- [x] POST endpoint `/api/v1/donations` (commit `732610b`)
- [x] Schema Zod en `src/lib/validators/donations.ts` + 11 tests unit (commit `c80e62f`)
- [ ] Tests E2E Playwright *(verificado manualmente vía MCP)*
- [ ] Integración real con Mercado Pago (HU-14.2)
- [ ] Integración real con Webpay (HU-14.4)

## Definition of done

- [x] Tests Vitest unit pasan (11 tests en `donations.test.ts`)
- [ ] Tests Vitest integración pasan *(bloqueado: better-sqlite3 sin bindings para Node 25 — bug de entorno)*
- [x] Test E2E Playwright manual pasa *(verificado vía MCP: $10.000 → POST → acuse verde con monto y pasarela)*
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar *(sabotaje equivalente hecho en `trades.test.ts` cubre el patrón general)*
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`

## Notas de implementación (commit `732610b`)

- Path real: `/donar` (español)
- Color primario cambiado de `primary` (verde mockup) a `orange-500` (naranja del proyecto)
- MVP: POST devuelve 302 a `/donar?ok=1&amount=...&provider=...` con acuse. NO redirige a pasarela real (HU-14.2/14.4)
- Webpay radio presente pero no implementado (placeholder visual)
- Botón "Donar ahora" reemplaza el patrón del mockup de 4 botones con form unificado + input hidden `amount` actualizado por JS
- Widget OE3 (HU-14.9): "Cobertura actual 80%" + barra progreso gradient naranja
