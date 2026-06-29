# HU-01.3 — Login con Google OAuth (state + PKCE)

**Estado:** **diferida** | **Prioridad:** P2 (era P1) | **REQ padre:** REQ-01-autenticacion-sesiones

> ⚠️ **DIFERIDA** — En esta fase el proyecto solo usa email + password contra
> el seed de usuarios demo (HU-01.7). El botón "Continuar con Google" se
> renderiza como placeholder visual (sin acción) para mantener coherencia
> con el producto final. Re-activar cuando haya credenciales reales de
> Google Cloud Console y el equipo de producto defina el flujo de OAuth.

## Historia de usuario

**Como** vecino o prestador con cuenta Google
**Quiero** iniciar sesión con un solo click usando Google
**Para** evitar crear y recordar otra contraseña

## Criterios de aceptación (Gherkin) — referenciales, no activos

### Escenario: Botón "Continuar con Google" en demo
  Dado que estoy en cualquier vista con `<AuthButtons>`
  Cuando hago click en "Continuar con Google"
  Entonces NO hay redirección a Google
  Y se muestra un toast/alert "Próximamente — en esta demo solo email + contraseña"
  Y el handler queda como `() => mostrarProximamente('Google')`

### Escenario: Botón deshabilitado como placeholder
  Cuando se inspecciona el botón
  Entonces tiene atributo `aria-disabled="true"`
  Y NO tiene `href` ni `onclick` que redirija

## Tareas técnicas (cuando se reactive)

- [ ] Variables `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` documentadas en `wrangler.toml.example`
- [ ] Helper `src/lib/services/auth/oauth/google.ts` con generación de state + PKCE
- [ ] Endpoint `src/pages/api/v1/auth/oauth/[provider].ts`
- [ ] Endpoint `src/pages/api/v1/auth/oauth/[provider]/callback.ts`
- [ ] Schema `oauth_accounts` en `src/database/schema.ts` con UNIQUE(provider, provider_user_id)
- [ ] Tests `tests/unit/auth/oauth/google.test.ts` y `tests/integration/auth/oauth-google.test.ts` con mock de id_token
- [ ] Reemplazar handler visual-only en `components/AuthButtons.astro` por redirección real
- [ ] Actualizar modal de login en `src/pages/index.astro` para que el botón ejecute el flujo

## Definition of done (cuando se reactive)

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`