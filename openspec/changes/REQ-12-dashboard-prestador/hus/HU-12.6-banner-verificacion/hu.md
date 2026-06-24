# HU-12.6 — Banner de estado de verificación

**Estado:** implementada-mvp-parcial | **Prioridad:** P0 | **REQ padre:** REQ-12-dashboard-prestador

## Historia de usuario

**Como** prestador
**Quiero** ver claramente si mi verificación está pendiente o rechazada
**Para** saber qué pasos seguir para aparecer en búsqueda

## Criterios de aceptación (Gherkin)

### Escenario: Banner pendiente
  Dado un prestador con verificación `pendiente`
  Cuando entra al dashboard
  Entonces ve un banner amarillo: "Tu verificación está en revisión"

### Escenario: Banner rechazado con CTA reenviar
  Dado verificación `rechazado` con motivo
  Cuando entra al dashboard
  Entonces ve banner rojo con el motivo y botón "Reenviar"
  Y el click va a `/verificar-oficio` *(path real en español)*

### Escenario: Sin banner si verificado
  Dado verificación `verificado`
  Cuando renderiza
  Entonces el banner no se muestra *(MVP: el banner SIEMPRE se muestra porque no leemos el estado real — pendiente)*

## Tareas técnicas

- [x] Banner amarillo inline en `src/pages/dashboard-prestador.astro` (commit `2a285b6`) — siempre visible, linkea a `/verificar-oficio`
- [ ] Componente `src/components/dashboard/provider/VerificationBanner.astro` *(inline en .astro por ahora)*
- [ ] Helper SSR `getVerificationStatus(userId)` *(pendiente: schema `provider_verifications` no existe todavía)*
- [ ] Mockup: ya incluye banner en `mockups/dashboard-provider.html` línea 127 — fiel
- [ ] Tests `tests/e2e/provider-verification-banner.spec.ts`

## Definition of done

- [x] Render fiel al mockup con banner amarillo + ícono + CTA "Ver estado" → `/verificar-oficio`
- [ ] Condicionalidad por estado real (pendiente | rechazado | verificado) — *MVP siempre muestra pendiente*
- [ ] Tests Vitest unit
- [ ] PR mergeado

## Notas de implementación (commit `2a285b6`)

- En MVP el banner está **hardcodeado** como "Tu verificación está en revisión" — no consulta la DB
- Cuando exista la tabla `provider_verifications`, este banner se vuelve dinámico: amarillo pendiente / rojo rechazado con motivo / oculto verificado
- Pendiente integrar con `getVerificationStatus(userId)` una vez que el schema esté creado
