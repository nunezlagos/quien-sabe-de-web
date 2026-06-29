# HU-01.4 — Login con Facebook OAuth

**Estado:** **diferida** | **Prioridad:** P2 (era P1) | **REQ padre:** REQ-01-autenticacion-sesiones

> ⚠️ **DIFERIDA** — En esta fase el proyecto solo usa email + password contra
> el seed de usuarios demo (HU-01.7). El botón "Continuar con Facebook" se
> renderiza como placeholder visual (sin acción). Re-activar después de que
> HU-01.3 (Google) esté implementado y validado como referencia.

## Historia de usuario

**Como** vecino o prestador con cuenta Facebook
**Quiero** iniciar sesión con Facebook
**Para** aprovechar mi cuenta social existente

## Criterios de aceptación (Gherkin) — referenciales, no activos

### Escenario: Botón "Continuar con Facebook" en demo
  Dado que estoy en cualquier vista con `<AuthButtons>`
  Cuando hago click en "Continuar con Facebook"
  Entonces NO hay redirección a Facebook
  Y se muestra un toast/alert "Próximamente — en esta demo solo email + contraseña"
  Y el handler queda como `() => mostrarProximamente('Facebook')`

## Tareas técnicas (cuando se reactive)

- [ ] Variables `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET` en `wrangler.toml.example`
- [ ] Helper `src/lib/services/auth/oauth/facebook.ts`
- [ ] Reuso del endpoint genérico `src/pages/api/v1/auth/oauth/[provider].ts`
- [ ] Tests `tests/unit/auth/oauth/facebook.test.ts` y `tests/integration/auth/oauth-facebook.test.ts`

## Definition of done (cuando se reactive)

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado
- [ ] Coverage ≥ 90 %
- [ ] Type check verde
- [ ] PR mergeado