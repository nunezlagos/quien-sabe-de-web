# Diseno tecnico — HU-19.4 — Invalidar todas las sesiones tras cambio de password

**REQ padre:** REQ-19-recuperacion-password

## Modelo de datos

No se introducen tablas D1. Se agrega una convención de keys KV:

- `session:<session_id>` (de REQ-01) → JSON `{ user_id, created_at, expires_at }`. Existente.
- `user_sessions:<user_id>` (NUEVO) → JSON `string[]` con los `session_id` activos del usuario.

`revokeAllSessions` debe actualizar ambos namespaces.

## Contrato de API

No se exponen endpoints. La operación es interna y disparada por
`consumeResetToken` de HU-19.3.

Hook en observabilidad (REQ-18): emitir evento
`session.revoked.bulk` con `{ user_id, count }` después de la revocación.
La integración con el bus de observabilidad queda como TODO si REQ-18 no
está listo; el helper `revokeAllSessions` puede aceptar `observability?`
opcional.

## Validaciones Zod

No aplica. La función toma `userId: number`.

## Componentes UI

No aplica.

## Flujo de interaccion (secuencial)

1. HU-19.3 completa el UPDATE de `users.password_hash` y el `kv.delete('pwreset:<token>')`.
2. Inmediatamente después, llama `revokeAllSessions(userId, { kv })`.
3. `revokeAllSessions`:
  1. `const list = await kv.get<string[]>('user_sessions:'+userId, 'json');`
  2. Si null → no-op.
  3. Para cada `sid` en list: `await kv.delete('session:'+sid)`. Capturar errores; continuar.
  4. `await kv.delete('user_sessions:'+userId)`.
  5. Retornar count de sesiones revocadas.
4. Si todo OK, HU-19.3 retorna 200.
5. Si `revokeAllSessions` lanza, HU-19.3 hace rollback del hash y retorna 500.

## Capa de servicios

```ts
// src/lib/services/auth/sessions.ts
export async function createSession(
  deps: { kv: KVNamespace },
  input: { userId: number; sessionId: string; ttl: number },
): Promise<void> {
  // 1. kv.put('session:'+sessionId, { user_id, ... }, { expirationTtl: ttl })
  // 2. const existing = (await kv.get('user_sessions:'+userId, 'json')) ?? [];
  // 3. existing.push(sessionId); kv.put('user_sessions:'+userId, JSON.stringify(existing), { expirationTtl: ttl });
}

export async function revokeAllSessions(
  deps: { kv: KVNamespace },
  userId: number,
): Promise<{ revoked: number }> {
  const list = (await kv.get<string[]>(`user_sessions:${userId}`, 'json')) ?? [];
  let revoked = 0;
  for (const sid of list) {
    try {
      await kv.delete(`session:${sid}`);
      revoked++;
    } catch (e) {
      console.error('[revokeAllSessions] partial failure', { userId, sid, error: e });
    }
  }
  await kv.delete(`user_sessions:${userId}`);
  return { revoked };
}
```

Adicionalmente, `destroySession(sid)` debe también remover `sid` del
arreglo `user_sessions:<user_id>` para evitar entradas huérfanas. Esto
implica que cada `destroySession` necesita conocer `user_id` (que está en
`session:<sid>`). Helper de REQ-01 actualizado:

```ts
export async function destroySession(deps, sid): Promise<void> {
  const session = await kv.get(`session:${sid}`, 'json');
  if (session?.user_id) {
    const list = (await kv.get(`user_sessions:${session.user_id}`, 'json')) ?? [];
    const filtered = list.filter((x) => x !== sid);
    await kv.put(`user_sessions:${session.user_id}`, JSON.stringify(filtered));
  }
  await kv.delete(`session:${sid}`);
}
```

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/sessions.test.ts` | `revokeAllSessions` con KV mock: 3 sesiones → 3 deletes + 1 delete del índice; sin sesiones → no-op; `destroySession` remueve del índice |
| Integracion | `tests/integration/auth/revoke-sessions.test.ts` (miniflare) | `createSession` × 3 + `revokeAllSessions` → todas las cookies reciben 401; login nuevo crea sesión válida; rollback de HU-19.3 si revoke falla |

## Dependencias y secuencia

- **Bloqueado por:** REQ-01 (esquema de sessions en KV). HU-19.3 (lo invoca).
- **Bloquea a:** ninguno; la observabilidad (REQ-18) es opcional.
- **Recursos compartidos:** `Astro.locals.runtime.env.SESSION` (KV namespace).

## Riesgos tecnicos

- Riesgo: el `kv.list` filtrado por metadata no existe en KV de Cloudflare → Mitigación: la Opcion A no usa `list`; solo `get`/`put`/`delete` con keys específicas. Verificado.
- Riesgo: REQ-01 no exporta `createSession` reutilizable → Mitigación: crear el helper aquí (T1) y refactorizar REQ-01 para usarlo (sub-tarea de coordinación con REQ-01, o hacer T1 huérfano si REQ-01 ya tiene la API necesaria).
- Riesgo: el JSON en `user_sessions:<user_id>` puede corromperse si dos requests escriben a la vez → Mitigación: usar `kv.put` con read-modify-write; en el peor caso, una sesión queda registrada dos veces y la revocación es idempotente (delete del mismo key dos veces es OK).
