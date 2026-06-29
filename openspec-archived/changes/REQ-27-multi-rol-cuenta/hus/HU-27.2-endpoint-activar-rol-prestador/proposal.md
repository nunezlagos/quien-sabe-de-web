# Propuesta — HU-27.2 — Endpoint activar rol prestador

**Estado:** propuesta | **REQ padre:** REQ-27-multi-rol-cuenta

## Contexto

Una vez que `user_roles` existe (HU-27.1), el vecino logueado que quiere ofrecer servicios necesita una vía para activar el rol prestador sin crear otra cuenta. Esta HU implementa `POST /api/v1/users/me/roles/prestador` (y genérico `/api/v1/users/me/roles/:role`) que es idempotente, respeta whitelist de roles auto-asignables (vecino + prestador; admin no auto-asignable), exige email verificado (REQ-20), actualiza sesión KV con el nuevo set de roles y redirige a `/create-trade` (REQ-21) tras éxito.

## Mockups de referencia

- `mockups/dashboard-user.html:62-64` — botón "Crear Perfil PRO" en card "Ofreces un servicio" que dispara este endpoint.

## Alternativas consideradas

### Opción A — Endpoint genérico `POST /api/v1/users/me/roles/:role` con whitelist
- Handler lee `:role` de la URL; valida whitelist `['vecino', 'prestador']`.
- Idempotente: si user ya tiene el rol, devuelve 200 sin error.
- Email verificado required (REQ-20).
- Pro: DRY, una sola ruta para todos los roles auto-asignables.
- Pro: bloquea explícitamente `admin` con 403.
- Contra: la URL genérica puede tentar a exponer más roles de los deseados; documentar whitelist.

### Opción B — Endpoint específico `POST /api/v1/users/me/roles/prestador`
- Pro: type-safe en compile time.
- Contra: duplicación si se agrega otro rol auto-asignable (ej. "moderador").

### Opción C — Endpoint admin `POST /api/v1/admin/users/:id/roles/:role`
- Pro: el admin otorga roles a otros.
- Contra: fuera del scope del REQ-27 (vecino auto-activación); vive en REQ-13 (admin dashboard).

## Decisión

Se elige **Opción A**. Una sola ruta con whitelist es suficiente para los roles auto-asignables; admin se otorga vía endpoint admin de REQ-13 (fuera de scope).

## Riesgos y mitigaciones

- Riesgo: el endpoint genérico permite intentar activar 'admin' → Mitigación: whitelist explícita `['vecino', 'prestador']`; cualquier otro valor devuelve 403.
- Riesgo: la sesión KV no se actualiza tras agregar el rol → Mitigación: invalidar la sesión actual y forzar re-login, O actualizar el payload de sesión con el nuevo set de roles (preferida esta segunda).
- Riesgo: race condition entre dos requests simultáneos del mismo user → Mitigación: `INSERT OR IGNORE` es atómico; el segundo request no hace nada.

## Métrica de éxito

- POST con sesión vecino verificado → 200 + nueva fila en `user_roles` + sesión KV actualizada.
- POST con user ya con rol prestador → 200 sin error (idempotente).
- POST con user sin verify email → 403.
- POST intentando rol `admin` → 403.
- E2E: click "Crear Perfil PRO" en /dashboard-user → activa rol → redirige a /create-trade.
- Sabotaje: olvidar la actualización de sesión KV → user navega pero middleware no ve el nuevo rol → test verifica que `requireRole('prestador')` acepta al user recién activado → restaurar.