# Propuesta — HU-19.4 — Invalidar todas las sesiones tras cambio de password

**Estado:** propuesta | **REQ padre:** REQ-19-recuperacion-password

## Contexto

Tras un reset de contraseña exitoso (HU-19.3), cualquier sesión activa del
usuario (de otros dispositivos o navegadores) debe quedar invalidada. Esto
cierra la ventana en la que un atacante con sesión robada podría seguir
usando la cuenta después de que la víctima recuperó el acceso. La
operación debe ser atómica con el cambio de password: si la revocación
falla, se hace rollback del hash para que el sistema quede en estado
consistente. Para evitar un `KV.list` O(N) sobre todo el namespace, se
mantiene un índice secundario `user_sessions:<user_id>` que guarda el set
de session_ids del usuario.

## Mockups de referencia

No aplica. Backend puro.

## Alternativas consideradas

### Opcion A — Índice secundario `user_sessions:<user_id>` + `SESSION.list` filtrado
- En cada `createSession(userId, sessionId)`, hacer `kv.put('user_sessions:'+userId, JSON.stringify([...existing, sessionId]))`.
- En `revokeAllSessions(userId)`: `kv.get('user_sessions:'+userId)`, parsear, `kv.delete('session:'+sid)` por cada uno, `kv.delete('user_sessions:'+userId)`.
- Pro: revocación rápida O(k) donde k = sesiones del usuario.
- Contra: requiere disciplina en `createSession` para mantener el índice; desincronización si una sesión se crea sin el índice (mitigar con cleanup periódico).

### Opcion B — `kv.list({ prefix: 'session:' })` y filtrar por metadata
- `list()` retorna todo el namespace; filtrar client-side.
- Pro: 0 índices secundarios.
- Contra: O(N) global; en una plataforma con muchos usuarios es prohibitivo.

### Opcion C — Almacenar `user_id` en cada key de sesión y usar list con prefix
- `kv.list({ prefix: 'session_user:'+userId+':' })` o similar.
- Pro: sin JSON parsing; filtros KV.
- Contra: requiere reestructurar el esquema de session keys de REQ-01; mayor cambio.

## Decision

Se elige **Opcion A**. El índice secundario es la solución correcta: O(k)
en revocación, k es típicamente 1-3. El acoplamiento con `createSession` de
REQ-01 es el costo; documentar y agregar test de integración que verifica
"createSession siempre actualiza el índice".

## Riesgos y mitigaciones

- Riesgo: `createSession` de REQ-01 no actualiza el índice → Mitigación: helper compartido `createSession(userId, ...)` exportado por REQ-19 que actualiza ambos keys; test cubre.
- Riesgo: la lista de session_ids crece sin límite si el usuario crea muchas → Mitigación: cuando la lista supera 50, compactar a 10 más recientes (decisión futura); por ahora aceptable.
- Riesgo: la revocación KV puede ser parcial si un `delete` falla a mitad → Mitigación: try/catch; si falla, loggear y continuar; la siguiente request que use la cookie получает 401 porque session key no existe o firma no valida; el user ve "sesión expirada".
- Riesgo: rollback del hash de HU-19.3 no restaura sesiones ya borradas → Mitigación: la sesión borrada por el intento fallido es aceptable (sigue siendo consistente con el fallo); documentar.

## Metrica de exito

- `revokeAllSessions(42)` con 3 sesiones activas en `user_sessions:42` → las 3 keys `session:s1|s2|s3` quedan eliminadas + el índice `user_sessions:42` queda eliminado.
- Siguiente request con cookie `s1` recibe 401.
- Login nuevo del user_id=42 crea sesión nueva válida.
- Si `revokeAllSessions` lanza a mitad, HU-19.3 hace rollback del hash y deja las sesiones que aún queden.
- Test integración cubre happy path, fallo parcial y rollback.
