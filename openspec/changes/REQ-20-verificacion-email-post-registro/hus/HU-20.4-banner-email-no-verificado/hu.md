# HU-20.4 — Banner y gate de acciones críticas para email no verificado

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-20-verificacion-email-post-registro

## Historia de usuario

**Como** plataforma
**Quiero** bloquear acciones críticas mientras el email no esté verificado
**Para** preservar la calidad y combatir fraude

## Criterios de aceptación (Gherkin)

### Escenario: Banner visible en dashboard
  Dado un user logueado sin `email_verified_at`
  Cuando navega a `/dashboard-user`
  Entonces se renderiza banner amarillo encima del bloque "¡Hola, Vecino!" (`mockups/dashboard-user.html:29-39`) con texto "Verifica tu email para continuar" y botón "Reenviar"

### Escenario: POST review sin verificar → 403
  Dado user sin verificar
  Cuando envía `POST /api/v1/providers/42/reviews`
  Entonces recibo status 403 con `{ "error": "email no verificado" }`

### Escenario: POST contact sin verificar → 403
  Cuando intenta contactar (`POST /api/v1/providers/42/contact`)
  Entonces recibo status 403

### Escenario: Tras verificar, banner desaparece y acciones funcionan
  Cuando completa HU-20.2
  Entonces el banner deja de renderizarse y las acciones críticas devuelven 200/201

## Tareas técnicas

- [ ] Middleware `requireVerifiedEmail` en `src/lib/middleware/auth.ts` aplicado a POST reviews, contact, providers/me
- [ ] Componente `<EmailVerificationBanner />` en `src/components/banners/EmailVerificationBanner.astro` (estilo: `bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3` con `<i class="ri-error-warning-line text-yellow-500">`)
- [ ] Insertar banner en `src/pages/dashboard-user.astro` antes del bloque hero
- [ ] Tests `tests/integration/middleware/require-verified.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
