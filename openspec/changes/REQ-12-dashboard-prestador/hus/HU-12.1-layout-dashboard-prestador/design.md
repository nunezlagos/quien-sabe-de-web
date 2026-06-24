# Diseño técnico — HU-12.1 — Layout dashboard prestador con sidebar y tabs

**REQ padre:** REQ-12-dashboard-prestador

## Modelo de datos

No introduce tablas nuevas. Lee datos ya existentes:

- `users` (rol, nombre)
- `providers` (oficio principal, slug, rating cacheado)

(No requiere migración Drizzle propia.)

## Contrato de API

Esta HU no expone endpoints nuevos. Consume datos vía render SSR a partir de la sesión y de servicios ya existentes (`getCurrentProvider`).

## Validaciones Zod

No aplica. El acceso se valida por middleware de sesión y rol.

## Componentes UI

### Páginas Astro

- `src/pages/dashboard-provider.astro` — entry SSR del dashboard, monta el layout y secciones placeholder.
  - Mockup base: `mockups/dashboard-provider.html:13-363`.

### Componentes Astro reutilizables

- `src/components/dashboard/provider/Layout.astro` — props: `currentSection: 'resumen' | 'perfil' | 'servicios' | 'resenas'`, `provider: { name, trade, ratingAvg }`. Renderiza nav superior, grid `md:grid-cols-4`, sidebar y slot `<slot />` para el panel principal.
  - Mockup base: `mockups/dashboard-provider.html:15-66`.
  - Islas requeridas: no (HTML puro + scroll anchors).
- `src/components/dashboard/provider/SidebarNav.astro` — props: `activeAnchor: string`, `availability: boolean`. Renderiza el `<nav>` con toggle de disponibilidad y los 4 links + botón Soporte.
  - Mockup base: `mockups/dashboard-provider.html:47-65`.
  - Islas requeridas: sí (toggle de disponibilidad como `client:visible`).
- `src/components/dashboard/provider/PreviewButton.astro` — props: `slug: string`. Botón "Previsualizar Perfil Público".
  - Mockup base: `mockups/dashboard-provider.html:71-75`.
  - Islas requeridas: sí (abre modal — desarrollado en HU-12.7).

## Flujo de interacción (secuencial)

1. Usuario completa login en `/login` (REQ-02).
2. Backend detecta rol `prestador` y emite `302 /dashboard-provider`.
3. Astro SSR ejecuta el middleware `requireRole('prestador')` en `src/middleware.ts`.
4. Si la sesión es inválida o el rol no coincide, responde `302 /login?next=/dashboard-provider`.
5. Si pasa, `dashboard-provider.astro` resuelve `provider` desde `Astro.locals.runtime.env.DB`, renderiza `Layout.astro` con `SidebarNav.astro` y el slot principal que aloja las secciones (HU-12.2 a HU-12.6).
6. Click en un link `<a href="#perfil">` (`mockups/dashboard-provider.html:59`) hace scroll y actualiza `aria-current`.

## Capa de servicios

- `src/lib/services/provider.service.ts`:
  - `getCurrentProvider(env, userId): Promise<ProviderSummary>` — lee `providers` por `user_id`.
  - `requireProviderSession(context): Promise<{ user, provider }>` — helper SSR usado por la ruta.
- `src/lib/middleware/role.ts`:
  - `requireRole(role: 'prestador' | 'cliente' | 'admin'): MiddlewareHandler` — verifica sesión + rol o redirige.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/middleware/require-role.test.ts` | Redirect y respuesta de `requireRole` con casos sin sesión, rol distinto y rol válido. |
| Integración | `tests/integration/dashboard/provider-layout.test.ts` | Ruta `/dashboard-provider` devuelve 200 con sesión válida, 302 sin sesión, 403 con rol distinto. |
| E2E | `tests/e2e/dashboard-provider-layout.spec.ts` | Login → redirect a `/dashboard-provider` → sidebar con 4 links + soporte + CTA preview visibles. |

## Dependencias y secuencia

- **Bloqueado por:** REQ-02 (login y sesión), middleware base.
- **Bloquea a:** HU-12.2, HU-12.3, HU-12.4, HU-12.5, HU-12.6, HU-12.7 (todas montan dentro del layout).
- **Recursos compartidos:** `Astro.locals.runtime.env.DB`, `SESSION` (KV), middleware global `src/middleware.ts`.

## Riesgos técnicos

- Riesgo: el toggle "Disponible" del mockup (`dashboard-provider.html:51-55`) sugiere un endpoint adicional. Mitigación: marcar como placeholder visual sin mutación en esta HU; gestionar en una HU futura.
- Riesgo: doble redirect (middleware + ruta) en sesiones expiradas. Mitigación: middleware centraliza la regla y la ruta sólo asume sesión válida.
- Riesgo: anchors rompen el back-button. Mitigación: usar `history.replaceState` desde la isla de navegación si se necesita ajuste fino.
