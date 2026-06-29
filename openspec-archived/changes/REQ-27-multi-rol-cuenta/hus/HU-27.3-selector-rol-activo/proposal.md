# Propuesta — HU-27.3 — Selector de rol activo en navbar

**Estado:** propuesta | **REQ padre:** REQ-27-multi-rol-cuenta

## Contexto

Cuando un user tiene más de un rol (HU-27.2), debe poder cambiar entre el contexto "Vecino" y "Prestador" para que el navbar refleje el dashboard correcto y los endpoints server-side evalúen el rol activo correcto. Esta HU entrega `<RoleSwitcher />`, un dropdown en el navbar (sólo visible si `roles.length > 1`), que setea una cookie firmada `active_role` y redirige al dashboard correspondiente. La cookie usa el mismo helper `signCookie/verifyCookie` de HU-22.1.

## Mockups de referencia

- `mockups/dashboard-user.html:15-25` — navbar `bg-white shadow-sm sticky top-0` donde se inserta el selector. El logo va a la izquierda; el selector queda entre el logo y el link "Cerrar Sesión" actual.

## Alternativas consideradas

### Opción A — Dropdown en navbar + cookie firmada `active_role` + redirect a dashboard
- Componente server-rendered que lee `Astro.locals.session.roles` y muestra el dropdown sólo si `roles.length > 1`.
- Click en opción → `fetch POST /api/v1/users/me/active-role` que setea cookie + actualiza sesión KV + redirige.
- Pro: cookie firmada con HMAC igual a HU-22.1 (reuso de helper).
- Pro: server-side middleware puede leer la cookie para decisiones contextuales.
- Contra: un click más para el user (vs un toggle directo), pero la confirmación reduce errores.

### Opción B — Toggle switch directo en navbar (sin dropdown)
- Pro: 1 click para cambiar.
- Contra: con 3 roles, no escala; el dropdown es más explícito.

### Opción C — Cambiar rol activo en sesión KV sin cookie
- Pro: cookie-less.
- Contra: el SSR no puede saber el rol activo en el primer request; necesita leer KV en cada page load, agregando latencia.

## Decisión

Se elige **Opción A**. El dropdown es explícito, escala a N roles, y la cookie firmada permite SSR determinístico.

## Riesgos y mitigaciones

- Riesgo: la cookie `active_role` se manipula en cliente → Mitigación: HMAC verifica firma (reuso de `signed-cookie.ts`).
- Riesgo: el SSR lee cookie con valor inválido → Mitigación: si `verifyCookie` falla, fallback al primer rol del array (default).
- Riesgo: el user cambia de rol activo pero el endpoint requiere otro rol (HU-27.4) → Mitigación: el middleware acepta cualquier rol del set, no sólo el activo.

## Métrica de éxito

- User con roles `['vecino', 'prestador']` ve dropdown con 2 opciones en navbar.
- User con rol único `['vecino']` NO ve dropdown.
- Click en "Prestador" → cookie `active_role=prestador` seteada + redirige a `/dashboard-provider`.
- E2E: cookie alterada manualmente a valor random → next request cae a fallback del primer rol.
- Sabotaje: no firmar la cookie → user edita a `admin` → middleware acepta → test verifica que el SSR del dashboard-admin rechaza → restaurar.