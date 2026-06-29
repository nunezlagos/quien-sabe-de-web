# HU-12.1 — Layout dashboard prestador con sidebar y tabs

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-12-dashboard-prestador
**Rama:** `feat/HU-12.1-layout-dashboard-prestador`

## Tareas técnicas

- [ ] **T1** Servicio `src/lib/services/provider.service.ts` exportando `getCurrentProvider(env, userId): Promise<ProviderSummary>` y `requireProviderSession(context): Promise<{user, provider}>` (helper SSR).
- [ ] **T2** Helper de middleware `requireRole(role: 'prestador' | 'cliente' | 'admin'): MiddlewareHandler` en `src/lib/middleware/role.ts`. Redirect 302 a `/login?next=...` si falla.
- [ ] **T3** Componente `src/components/dashboard/provider/Layout.astro` con props `{currentSection, provider}` y slot principal. Renderiza header, grid `md:grid-cols-4`, sidebar. Mockup base `mockups/dashboard-provider.html:15-66`.
- [ ] **T4** Componente `src/components/dashboard/provider/SidebarNav.astro` con props `{activeAnchor, availability}`. Mockup base `mockups/dashboard-provider.html:47-65`. Toggle de disponibilidad como placeholder visual (sin mutación en esta HU).
- [ ] **T5** Componente `src/components/dashboard/provider/PreviewButton.astro` con prop `slug`. Mockup `mockups/dashboard-provider.html:71-75`. Botón abre el modal desarrollado en HU-12.7 — por ahora solo emite el click, la isla se monta en HU-12.7.
- [ ] **T6** Página `src/pages/dashboard-provider.astro` — entry SSR. Resuelve sesión + provider, monta `Layout.astro` + `SidebarNav.astro` + slots para HU-12.2 a HU-12.6 (placeholders vacíos en esta HU).
- [ ] **T7** Aplicar middleware `requireRole('prestador')` en el archivo o en `src/middleware.ts` global con matcher `/dashboard-provider`.
- [ ] **T8** Tests:
  - [ ] `tests/unit/middleware/require-role.test.ts` — redirect cuando no hay sesión, redirect cuando rol distinto, pasa cuando rol válido.
  - [ ] `tests/unit/services/provider.service.test.ts` — `getCurrentProvider` devuelve summary; `requireProviderSession` lanza si user no es prestador.
  - [ ] `tests/integration/dashboard/provider-layout.test.ts` — ruta devuelve 200 con sesión válida, 302 sin sesión, 403 con rol distinto.
  - [ ] `tests/e2e/dashboard-provider-layout.spec.ts` — login → redirect a `/dashboard-provider` → sidebar con 4 links + soporte + CTA preview visibles.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado: quitar la guarda `session.role === 'prestador'` en `requireRole` → test de integración con rol vecino da 200 en vez de 403 → restaurar
- [ ] Sabotaje 2: cambiar `currentSection` default a `null` en `Layout.astro` → el `aria-current` no se aplica y test E2E falla → restaurar
- [ ] Coverage ≥ 90 % en `src/lib/middleware/role.ts`, `src/lib/services/provider.service.ts`
- [ ] Type check verde
- [ ] Commit `feat: layout dashboard prestador` y push