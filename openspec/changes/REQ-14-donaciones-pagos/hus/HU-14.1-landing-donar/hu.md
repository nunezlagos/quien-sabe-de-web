# HU-14.1 — Landing /donate con CTA y montos sugeridos

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-14-donaciones-pagos

## Historia de usuario

**Como** donante (anónimo o autenticado)
**Quiero** ver una landing clara con montos sugeridos
**Para** donar fácilmente

## Criterios de aceptación (Gherkin)

### Escenario: Render SSR de /donate
  Cuando visito `/donate`
  Entonces el HTML incluye CTA "Donar ahora" y montos sugeridos: 3000, 5000, 10000, 25000 CLP
  Y existe selector de monto custom

### Escenario: Botón inicia checkout MP
  Cuando clickeo "Donar $5.000 con Mercado Pago"
  Entonces se invoca `POST /api/v1/donations/checkout`
  Y se redirige a la URL de preferencia MP

### Escenario: Monto mínimo 1000 CLP
  Cuando ingreso monto custom 500
  Entonces se muestra error inline "mínimo $1.000"

## Tareas técnicas

- [ ] Vista `src/pages/donate.astro`
- [ ] Componente `src/components/donations/AmountSelector.astro`
- [ ] Componente `src/components/donations/PaymentButtons.astro`
- [ ] Tests `tests/e2e/donate-landing.spec.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
