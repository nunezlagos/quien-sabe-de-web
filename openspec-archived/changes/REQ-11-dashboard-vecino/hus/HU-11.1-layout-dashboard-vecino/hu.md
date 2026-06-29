# HU-11.1 — Layout del dashboard del vecino

**Estado:** implementada | **Prioridad:** P0 | **REQ padre:** REQ-11-dashboard-vecino

## Historia de usuario

**Como** vecino autenticado
**Quiero** aterrizar en mi panel privado tras login
**Para** tener un punto central para mis acciones

## Criterios de aceptación (Gherkin)

### Escenario: Login redirige a /dashboard-user
  Dado un vecino que se acaba de loguear y está onboardeado
  Cuando termina el login
  Entonces recibo redirect a `/dashboard-user`

### Escenario: Layout con tabs y header de perfil
  Dado un vecino en `/dashboard-user`
  Cuando renderiza
  Entonces ve un header con foto/email y tabs: "Historial", "Mis reseñas", "Perfil"

### Escenario: Sin sesión → 302 a /login
  Dado un request sin sesión
  Cuando solicita `/dashboard-user`
  Entonces recibo redirect a `/login?next=/dashboard-user`

## Tareas técnicas

- [ ] Vista `src/pages/dashboard-user.astro`
- [ ] Componente `src/components/dashboard/user/Layout.astro`
- [ ] Middleware redirect post-login en `src/lib/middleware/postLoginRedirect.ts`
- [ ] Tests `tests/e2e/dashboard-user-layout.spec.ts`
- [ ] Refactorizar `mockups/dashboard-user.html`: layout con tabs 'Historial' | 'Mis reseñas' | 'Perfil' (en lugar del grid actual de tarjetas). Cada tab es un panel con contenido lazy-loaded. El banner email (REQ-20) y la card 'Crear Perfil PRO' (REQ-27) se mantienen fuera de los tabs (sticky top).

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
