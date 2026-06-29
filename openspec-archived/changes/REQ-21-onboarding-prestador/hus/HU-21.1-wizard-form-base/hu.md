# HU-21.1 — Port del wizard create-trade desde mockup

**Estado:** implementada-mvp | **Prioridad:** P0 | **REQ padre:** REQ-21-onboarding-prestador

## Historia de usuario

**Como** vecino con cuenta
**Quiero** completar un formulario claro para ofrecer mis servicios
**Para** crear mi perfil profesional en la plataforma

## Criterios de aceptación (Gherkin)

### Escenario: Render del wizard fiel al mockup
  Cuando navego a `/create-trade`
  Entonces veo los 3 bloques del mockup `mockups/create-trade.html`:
    - Bloque "1. Información Básica" (línea 52-77): Nombre Visible, Oficio, Bio (textarea rows=2)
    - Bloque "2. Contacto y Precios" (línea 80-99): WhatsApp con prefix "+56 9", Precio Base con prefix "$"
    - Bloque "3. Verificación" (línea 102-109): zona de upload Certificado opcional
  Y los estilos son `bg-white p-6 rounded-2xl shadow-sm border border-gray-100`

### Escenario: Botones "Volver" y "Crear Perfil"
  Cuando renderizo el form
  Entonces el botón "Volver" enlaza a `/dashboard-user` y "Crear Perfil" es submit (referencia `mockups/create-trade.html:111-116`)

### Escenario: Validación cliente bloquea envío incompleto
  Cuando intento submit sin oficio
  Entonces el browser muestra error de required en el `<select>` (línea 62-70)

### Escenario: Mobile responsive
  Cuando reviso en viewport < 768px
  Entonces los `grid md:grid-cols-2` colapsan a 1 columna (clases del mockup línea 55, 83)

## Tareas técnicas

- [ ] Vista Astro `src/pages/create-trade.astro` portando el HTML de `mockups/create-trade.html`
- [ ] Componente `<ProviderWizard />` en `src/components/onboarding/ProviderWizard.astro`
- [ ] Tailwind v4 directamente (no nuevo config; usar `@import "tailwindcss"`)
- [ ] Tests `tests/e2e/create-trade.spec.ts` con Playwright validando render y submit

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
