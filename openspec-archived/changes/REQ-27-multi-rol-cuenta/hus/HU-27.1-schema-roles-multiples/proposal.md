# Propuesta — HU-27.1 — Esquema user_roles + migración data

**Estado:** propuesta | **REQ padre:** REQ-27-multi-rol-cuenta

## Contexto

Hoy `users.role` es una columna string que limita a un rol por cuenta. El REQ-27 necesita multi-rol (vecino + prestador simultáneamente). Esta HU introduce la tabla `user_roles(user_id, role, granted_at, granted_by)` con UNIQUE `(user_id, role)`, ejecuta un backfill desde `users.role` (preservando el rol existente), y mantiene `users.role` deprecated durante 1 release con dual-write (HU-27.2 inserta en ambas tablas al activar un rol).

## Mockups de referencia

No aplica (HU backend). El consumidor visual es `mockups/dashboard-user.html:62` (botón "Crear Perfil PRO") que HU-27.2 conecta.

## Alternativas consideradas

### Opción A — Tabla `user_roles` con PK compuesta + dual-write temporal
- Tabla `user_roles(user_id, role, granted_at, granted_by)` con `UNIQUE (user_id, role)` y `CHECK role IN ('vecino','prestador','admin')`.
- Migración data: `INSERT INTO user_roles SELECT id, role, unixepoch(), NULL FROM users WHERE role IS NOT NULL` (backfill).
- Dual-write en HU-27.2: cuando se activa un rol, INSERT en `user_roles` Y UPDATE `users.role` (mantener sync).
- Eliminar `users.role` en release posterior (no en esta HU).
- Pro: transición gradual sin romper queries existentes que leen `users.role`.
- Pro: CHECK + UNIQUE previene duplicados y valores fuera de enum.
- Contra: requiere disciplina de mantener dual-write por 1 release.

### Opción B — Eliminar `users.role` inmediatamente
- Pro: estado limpio desde el día 1.
- Contra: rompe todas las queries existentes que leen `users.role`; requiere refactor masivo de REQ-01/04/12/13.

### Opción C — Usar `users.roles` como JSON array
- Pro: una columna, una fila por user.
- Contra: pierde auditabilidad (quién otorgó qué rol cuándo); no se puede indexar bien; CHECK de valores dentro del JSON requiere validación runtime.

## Decisión

Se elige **Opción A**. La tabla con dual-write es el patrón estándar de migraciones de schema en producción: introducir el modelo nuevo sin romper el viejo, deprecar gradualmente, eliminar en release posterior.

## Riesgos y mitigaciones

- Riesgo: dual-write diverge si una INSERT falla → Mitigación: usar transacción D1 batch (`db.batch([insertUserRole, updateUsersRole])`).
- Riesgo: backfill duplica filas si se corre dos veces → Mitigación: usar `INSERT OR IGNORE` con UNIQUE constraint.
- Riesgo: queries que leen `users.role` muestran el rol "deprecated" sin el nuevo set completo → Mitigación: documentar en `docs/migration-strategy.md` que `users.role` representa el primer rol del usuario (legacy); para el set completo, leer `user_roles`.

## Métrica de éxito

- `CREATE TABLE user_roles` aplica vía migración.
- Backfill: cada user con `users.role IS NOT NULL` queda con 1 fila en `user_roles`.
- INSERT duplicado `(user_id, role)` falla con UNIQUE.
- INSERT con `role="superhero"` falla con CHECK.
- Sabotaje: olvidar el backfill → users existentes sin filas en `user_roles` → query de HU-27.2 retorna set vacío → test verifica que cada user legacy tiene fila → restaurar.