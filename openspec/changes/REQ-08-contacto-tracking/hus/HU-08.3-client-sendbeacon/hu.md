# HU-08.3 — Botones de contacto wireados con sendBeacon

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-08-contacto-tracking

## Historia de usuario

**Como** vecino
**Quiero** que el click en WhatsApp/llamada/email registre el contacto sin bloquear el redirect
**Para** que las métricas se capturen aun si la red es lenta

## Criterios de aceptación (Gherkin)

### Escenario: Click WhatsApp registra y redirige
  Dado un perfil con botón WhatsApp y `provider_id=42`
  Cuando hago click en el botón
  Entonces se invoca `navigator.sendBeacon("/api/v1/contacts/track", payload)` con `kind="whatsapp"`
  Y la navegación a `https://wa.me/56912345678` ocurre

### Escenario: Click email
  Cuando hago click en el botón email
  Entonces se dispara sendBeacon con `kind="email"`
  Y la URL `mailto:` se abre

### Escenario: Si tracking falla, redirect ocurre igual
  Dado que el endpoint retorna 500
  Cuando hago click en WhatsApp
  Entonces sendBeacon devuelve true pero la respuesta es ignorada
  Y el redirect a `wa.me` ocurre normalmente

## Tareas técnicas

- [ ] Componente `src/components/providers/ContactButtons.astro` con script cliente
- [ ] Helper cliente `src/lib/client/track-contact.ts` usando `navigator.sendBeacon`
- [ ] Atributos `data-track-kind`, `data-provider-id`, `data-href`
- [ ] Tests `tests/e2e/contact-tracking.spec.ts` (verifica request + redirect)

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
