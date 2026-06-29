# Propuesta — HU-02.4 — Middleware redirige a /onboarding si incompleto

**Estado:** propuesta | **REQ padre:** REQ-02-onboarding-vecino

## Contexto

Un vecino registrado pero sin onboarding queda "varado": puede loguearse pero `/dashboard-user` se ve roto. Esta HU agrega lógica al middleware global de HU-01.2: si el usuario autenticado tiene rol `vecino` y `onboarded_at IS NULL`, redirigir cualquier ruta privada a `/onboarding`; a la inversa, si ya está onboardeado y visita `/onboarding`, redirigir a `/dashboard-user`. Es la pieza que da la experiencia fluida de "te acabas de registrar → te ayudo a completar".

## Mockups de referencia

- No existe mockup para el redirect (es comportamiento de middleware, no UI). **Mockup TBD** — la vista `/onboarding` se construye en HU-02.2.

## Alternativas consideradas

### Opcion A — Lógica en `src/middleware.ts` con lista explícita de rutas protegidas
- Helper `requireOnboarded(locals, url)` devuelve `Response.redirect('/onboarding', 302)` o `null`.
- Helper `requireOnboardedVecino` aplicado a lista de rutas (e.g. `/dashboard-user`, `/favorites`, `/resenas/nueva`).
- Caso inverso: si está onboardeado y va a `/onboarding` → redirect a `/dashboard-user`.
- Pro: declarativo, fácil de auditar.
- Contra: lista de rutas protegidas crece; documentar para mantener sincronizada con nuevas vistas.

### Opcion B — Redirect genérico a `/onboarding` para CUALQUIER ruta excepto assets y auth
- Pro: simple.
- Contra: rompe páginas públicas como `/transparencia`, `/terminos` que no requieren sesión; además, vecinos con onboarding incompleto que quieren leer `/privacy` quedarían atrapados.

### Opcion C — Flag en sesión KV (`requires_onboarding: true`)
- Pro: middleware no consulta DB.
- Contra: drift entre flag y DB real; suma complejidad al createSession.

## Decision

Se elige **Opcion A**. La lista explícita de rutas protegidas es auditable y testeable; se documenta en `src/lib/middleware/protectedRoutes.ts` para que cualquier dev que agregue una vista privada actualice la lista. El middleware de HU-01.2 ya enriquece `locals.user` con el row de DB en cada request, así que `locals.user.onboardedAt` está siempre fresco.

## Riesgos y mitigaciones

- Riesgo: prestadores caen en el redirect de onboarding de vecino → Mitigación: el helper `requireOnboardedVecino` filtra por `role === 'vecino'`. Prestadores siguen su propio flujo (REQ-21, REQ-03).
- Riesgo: visitante anónimo (sin sesión) se ve afectado → Mitigación: el helper retorna `null` (no redirect) cuando `locals.user === undefined`; la lógica de auth del HU-01.2 maneja el 401 en endpoints protegidos.
- Riesgo: redirect loop si `/onboarding` mismo requiere onboarding → Mitigación: agregar `/onboarding` a la lista de rutas exentas.
- Riesgo: middleware añade latencia por check de `onboardedAt` → Mitigación: el check ya está hecho por el middleware de HU-01.2 al enriquecer `locals.user`. Cero costo extra.

## Metrica de exito

- Vecino sin onboarding navegando a `/dashboard-user` → 302 a `/onboarding`.
- Vecino onboardeado navegando a `/onboarding` → 302 a `/dashboard-user`.
- Prestador navegando a `/dashboard-provider` sin completar su onboarding de prestador → flujo de prestador se aplica, NO el de vecino.
- Visitante anónimo navegando a `/` → sin redirect.
- Tests unit + integración + E2E verde; coverage ≥ 90% en `src/lib/middleware/requireOnboarded.ts`.
