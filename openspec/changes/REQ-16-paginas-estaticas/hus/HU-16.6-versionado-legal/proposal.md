# Propuesta — HU-16.6 — Versionado legal y re-aceptación

**Estado:** propuesta | **REQ padre:** REQ-16-paginas-estaticas

## Contexto

Cuando se actualizan los Términos, los usuarios con sesión deben re-aceptar
la nueva versión. Esta HU introduce (a) la lógica para comparar la versión
publicada vigente contra la que el usuario aceptó por última vez, (b) un
endpoint que registra la re-aceptación y (c) la integración con el
middleware para redirigir a `/terms?reaccept=true` cuando hay desfase. La
tabla `legal_versions` (creada en HU-16.3) y los campos `users.accepted_*`
son los cimientos; esta HU agrega la columna `accepted_terms_version` si
no existe y el endpoint.

## Mockups de referencia

- `mockups/terms.html:42-68` — vista `/terms` con CTAs reutilizables; el
  flag `?reaccept=true` agrega un banner amarillo arriba con CTA "Aceptar
  vN".
- `mockups/verification.html:124-126` — botón primario grande, patrón
  reusable para "Aceptar nuevos términos".

## Alternativas consideradas

### Opcion A — Middleware compara versión aceptada vs vigente + endpoint + redirect
- `src/middleware.ts` agrega un tercer handler en `sequence()`: `enforceLegalAcceptance`.
- Si usuario autenticado, `users.accepted_terms_version < legal_versions(version vigente de "terms")`, redirige a `/terms?reaccept=true`.
- Endpoint `POST /api/v1/users/me/accept-terms` actualiza `users.accepted_terms_at` y `users.accepted_terms_version`.
- Pro: una sola pieza de enforcement; cubre todo el árbol de rutas privadas.
- Contra: requiere conocer el binding de sesión en el middleware (ya lo hace el middleware de seguridad existente).

### Opcion B — Check dentro de cada vista privada
- Cada `Astro` page llama `requireAcceptance(Astro)` y redirige.
- Pro: control granular por vista.
- Contra: repetitivo; un dev nuevo puede olvidar el check; las vistas SSR de API no tienen página.

### Opcion C — Cron job que envía email a desactualizados
- Notifica por email y los invita a re-aceptar desde un link.
- Pro: proactivo, no bloquea UX.
- Contra: no garantiza que el usuario haga click; la ley puede exigir bloqueo hasta re-aceptar (decisión legal fuera de scope).

## Decision

Se elige **Opcion A**. La enforcement en middleware es el patrón estándar
para consentimientos y es el único que cubre API y vistas por igual. La
página `/terms?reaccept=true` agrega un banner con CTA y al hacer click el
formulario hace POST al endpoint y vuelve al destino original.

## Riesgos y mitigaciones

- Riesgo: visitantes anónimos quedan en loop si la lógica aplica a ellos → Mitigación: el middleware solo aplica a rutas con sesión (`Astro.locals.user`); anónimos pasan sin redirect.
- Riesgo: la columna `users.accepted_terms_version` aún no existe → Mitigación: agregarla en la migración de esta HU (T1).
- Riesgo: la versión "vigente" de `terms` cambia entre requests por un build intermedio → Mitigación: leer la última fila de `legal_versions` ordenada por `published_at DESC` con `LIMIT 1`; cachear 5 min en KV si la latencia de D1 fuera problema (decisión diferida).

## Metrica de exito

- Usuario con `accepted_terms_version="v1"` que intenta acceder a `/dashboard/user` cuando la versión vigente es `v2` → redirigido a `/terms?reaccept=true`.
- `POST /api/v1/users/me/accept-terms` con `{ "version": "v2" }` → 200, `users.accepted_terms_version="v2"`, `accepted_terms_at` actualizado.
- Anónimo en `/dashboard/user` → redirigido a `/login` (no a `/terms?reaccept=true`).
- Test integración cubre el ciclo completo con `createInMemoryDb` + KV mock.
