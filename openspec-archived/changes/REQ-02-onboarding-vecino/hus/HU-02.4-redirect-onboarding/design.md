# Diseno tecnico — HU-02.4 — Middleware redirige a /onboarding si incompleto

**REQ padre:** REQ-02-onboarding-vecino

## Modelo de datos

Sin cambios. La columna `users.onboardedAt` (HU-02.2) es la única fuente de verdad. El middleware de HU-01.2 ya la expone en `locals.user.onboardedAt` como parte del snapshot (ampliación menor del tipo).

## Contrato de API

No aplica (comportamiento de middleware HTTP, sin JSON).

## Validaciones Zod

No aplica.

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

Middleware global extendido:

```
1. Astro middleware (HU-01.2) hidrata locals.user
2. requireOnboardedVecino(locals, url):
   a. Si locals.user es undefined → null (no aplica)
   b. Si locals.user.role !== 'vecino' → null (no aplica)
   c. Si url.pathname NO está en protectedRoutes → null
   d. Si locals.user.onboardedAt es null → redirect('/onboarding', 302)
   e. Si url.pathname === '/onboarding' y locals.user.onboardedAt !== null → redirect('/dashboard-user', 302)
   f. return null
3. Llamar requireOnboardedVecino y aplicar redirect si retorna Response
4. next()
```

`protectedRoutes` se define en `src/lib/middleware/protectedRoutes.ts`:

```ts
export const PROTECTED_ROUTES_VECINO = [
  '/dashboard-user',
  '/favorites',
  '/resenas/nueva',
  '/cuenta',
]

export const ONBOARDING_ROUTE = '/onboarding'
```

## Validaciones Zod

No aplica.

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

(ver arriba)

## Capa de servicios

```ts
// src/lib/middleware/requireOnboarded.ts
export function requireOnboardedVecino(locals: App.Locals, url: URL): Response | null {
  if (!locals.user) return null
  if (locals.user.role !== 'vecino') return null

  if (url.pathname === ONBOARDING_ROUTE) {
    if (locals.user.onboardedAt !== null) {
      return Astro.redirect('/dashboard-user', 302)
    }
    return null  // déjalo entrar a /onboarding
  }

  if (PROTECTED_ROUTES_VECINO.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) {
    if (locals.user.onboardedAt === null) {
      return Astro.redirect(ONBOARDING_ROUTE, 302)
    }
  }

  return null
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/middleware/requireOnboarded.test.ts` | vecino sin onboardedAt + ruta protegida → redirect; vecino con onboardedAt + `/onboarding` → redirect a dashboard; vecino con onboardedAt + ruta protegida → null; prestador + ruta protegida → null; visitante anónimo → null |
| Integracion | `tests/integration/middleware/redirect-onboarding.test.ts` | request HTTP simulado a `/dashboard-user` con cookie de vecino sin onboard → 302 a `/onboarding`; idem al revés |

## Dependencias y secuencia

- **Bloqueado por:** HU-01.2 (middleware con `locals.user`), HU-02.2 (columna `onboardedAt`).
- **Bloquea a:** REQ-11 (dashboard-user asume onboarding completo), REQ-09 (crear reseña asume onboarding).
- **Recursos compartidos:** `src/middleware.ts` (extender), `App.Locals.user.onboardedAt` (campo nuevo en el type).

## Riesgos tecnicos

- Riesgo: nueva ruta privada olvidada en `PROTECTED_ROUTES_VECINO` → Mitigación: el redirect por defecto es NO actuar; documentar en `AGENTS.md` del proyecto que cada nueva vista privada de vecino requiere agregar a la lista.
- Riesgo: `locals.user.onboardedAt` es `undefined` cuando el snapshot no lo trae → Mitigación: tipar explícitamente `onboardedAt: number | null` en `App.Locals.user`; el middleware de HU-01.2 se extiende para incluir este campo.
- Riesgo: redirect loop entre `/onboarding` y `/dashboard-user` → Mitigación: la rama `/onboarding` está explícitamente manejada ANTES del check de protectedRoutes; ningún path dispara los dos redirects.
