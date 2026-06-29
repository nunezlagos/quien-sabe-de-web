# HU-20.4 — Tasks técnicas

## T1 — Helper server `shouldShowEmailBanner`

- Crear `src/lib/services/auth/email-verification.ts`
- Export `shouldShowEmailBanner(user): boolean`

## T2 — Componente `EmailVerificationBanner.astro`

- Crear `src/components/auth/EmailVerificationBanner.astro`
- Render server-side con email del usuario
- Script inline solo importa + invoca `inicializarEmailBanner()`

## T3 — Helper cliente `email-banner.ts`

- Crear `src/lib/client/auth/auth/email-banner.ts`
- `inicializarEmailBanner()` con handlers dismiss + resend + cooldown

## T4 — Layout `AuthLayout.astro`

- Crear layout que envuelve vistas autenticadas
- Inyecta `<EmailVerificationBanner>` cuando `shouldShowEmailBanner(user)`

## T5 — Estilos `.email-banner`

- Agregar a `src/styles/components.css`
- Cero `style="..."` inline

## T6 — Migrar vistas autenticadas a `AuthLayout`

- `src/pages/dashboard.astro`
- (futuras) `src/pages/dashboard-provider.astro`, `dashboard-admin.astro`

## T7 — Tests

- Unit: `shouldShowEmailBanner`
- Integración: render del banner según `email_verified_at`
- E2E: 4 escenarios según HU

## T8 — Verificación convenciones

```bash
# R1
grep -rn 'style="' src/components/auth/EmailVerificationBanner.astro src/lib/client/auth/email-banner.ts
# esperado: 0

# R2
grep -n '<script>' src/components/auth/EmailVerificationBanner.astro
# esperado: solo imports
```

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E Playwright → verde
- [ ] Sabotaje 1: cambiar `shouldShowEmailBanner` para retornar `true` siempre → test E2E "verificado NO ve banner" rojo → restaurar
- [ ] Sabotaje 2: no implementar cooldown 30s → test integración con 2 clicks consecutivos → 2do da 429 → restaurar
- [ ] Type check verde
- [ ] Cero `style="..."` inline
- [ ] PR mergeado a `develop`