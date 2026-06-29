# Propuesta — HU-27.4 — Middleware requireRole acepta multi-rol

**Estado:** propuesta | **REQ padre:** REQ-27-multi-rol-cuenta

## Contexto

Hoy el middleware `requireRole(role)` (REQ-01) lee `users.role` (string) y rechaza si no coincide exactamente. Con multi-rol (HU-27.1/27.2), un user puede tener `active_role='vecino'` pero el set `['vecino','prestador']`; el middleware actual lo rechazaría erróneamente al intentar un endpoint prestador. Esta HU refactoriza `requireRole` para que acepte el set de roles del user (OR sobre el array) y mantenga compatibilidad con callsites que pasan un rol único o un array.

## Mockups de referencia

No aplica (HU backend sin UI).

## Alternativas consideradas

### Opción A — `requireRole(role | roles[])` con `hasAnyRole` y compatibilidad backward-compatible
- Refactor: `requireRole(target: Role | Role[])` llama `hasAnyRole(user.roles, target)`.
- Callsites existentes que pasan `requireRole('prestador')` siguen funcionando (interpretado como `['prestador']`).
- Logging del rol activo + set para observabilidad.
- Pro: backward-compatible; refactor mínimo.
- Pro: soporta `requireRole(['prestador','admin'])` para endpoints multi-rol.
- Contra: ninguno significativo.

### Opción B — Crear `requireAnyRole(roles[])` separado de `requireRole(role)`
- Pro: firmas explícitas.
- Contra: dos funciones que hacen lo mismo con shape distinto; confusión para nuevos devs.

### Opción C — Evaluar sólo el `active_role` (no el set)
- Pro: simple.
- Contra: rompe el principio de "los permisos son del user, no del contexto". Un user vecino-prestador no podría consultar sus propios datos de prestador sin cambiar el rol activo. Mala UX.

## Decisión

Se elige **Opción A**. Backward-compatible, soporta multi-rol, una sola función para todos los casos.

## Riesgos y mitigaciones

- Riesgo: `requireRole(['vecino', 'admin'])` y el user tiene `roles=['prestador']` → aceptaría al user incorrectamente si la firma no se valida → Mitigación: la validación `hasAnyRole` hace `roles.some(r => userRoles.includes(r))` que es correcta.
- Riesgo: logging excesivo si cada request loguea el set → Mitigación: loguear sólo en debug mode (`DEBUG_AUTH=1`).
- Riesgo: callsites en `src/pages/api/v1/**` no se migraron y usan el viejo `requireRole(role)` → Mitigación: el backward-compat mantiene los callsites funcionando; este refactor no rompe nada.

## Métrica de éxito

- User `roles=['vecino','prestador']` con `active_role='vecino'` → `requireRole('prestador')` acepta (200).
- User `roles=['vecino']` → `requireRole('prestador')` rechaza (403).
- User `roles=['admin']` → `requireRole(['prestador','admin'])` acepta.
- Logs de debug muestran `roles=[...], active=...`.
- Sabotaje: cambiar `hasAnyRole` por check estricto del `active_role` → user multi-rol bloqueado → test verifica que `active_role='vecino'` con rol prestador en set es aceptado → restaurar.