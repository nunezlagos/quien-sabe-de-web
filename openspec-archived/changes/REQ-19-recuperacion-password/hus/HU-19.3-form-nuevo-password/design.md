# Diseno tecnico — HU-19.3 — Confirmar nuevo password usando token

**REQ padre:** REQ-19-recuperacion-password

## Modelo de datos

Cambio en `users`:
- `password_hash` (text, no null) — se introduce/usa la columna. Verificar
  con el schema de REQ-01; si no existe, agregarla en una migración previa
  a esta HU (T0).

No se introducen tablas adicionales. La key KV `pwreset:<token>` se
**elimina** tras uso exitoso.

## Contrato de API

### `POST /api/v1/auth/reset`

Auth: público.

Request:
```json
{ "token": "abc123...", "new_password": "S3gur@Pass!" }
```

Response 200:
```json
{ "success": true, "data": { "reset": true } }
```

Response 410 (token inválido o expirado): `{ success:false, error:"token inválido o expirado" }`
Response 422 (Zod password débil): `{ success:false, error:"password debe tener...", details:[...] }`
Response 422 (password igual al anterior): `{ success:false, error:"no puedes reusar tu contraseña actual" }`

## Validaciones Zod

```ts
// src/lib/validators/auth.ts (ampliar)
export const newPasswordSchema = z
  .string()
  .min(10, 'mínimo 10 caracteres')
  .max(128, 'máximo 128 caracteres')
  .regex(/[A-Z]/, 'debe incluir una mayúscula')
  .regex(/[a-z]/, 'debe incluir una minúscula')
  .regex(/[0-9]/, 'debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'debe incluir un símbolo');

export const resetBodySchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  new_password: newPasswordSchema,
});
```

## Componentes UI

- `src/pages/api/v1/auth/reset.ts` — endpoint POST. Lee `{ token, new_password }`; valida Zod; busca `kv.get('pwreset:'+token)`; si no existe → 410. Hashea; compara con `users.password_hash` actual (si existe y `verifyPassword` retorna true) → 422 "reusar contraseña". UPDATE `users` + `kv.delete(token)` + side-effect a HU-19.4. Try/catch general con rollback si HU-19.4 falla.

- `src/components/auth/PasswordStrengthMeter.astro` — `<script>` inline que escucha el input, calcula score (longitud + variedad), actualiza barra con clases `bg-red-400` / `bg-yellow-400` / `bg-primary`. ARIA: `role="meter"` con `aria-valuenow` dinámico.

- `src/pages/reset/[token].astro` (extender HU-19.2): cuando el token es válido, renderiza form con:
  - Input `new_password` con `PasswordStrengthMeter`.
  - Input `confirm_password` con validación de igualdad cliente.
  - Lista de requisitos (`mockups/reset-password.html:52-68`): cada `<li>` togglea ícono verde/rojo según validación Zod en vivo.
  - Botón submit que hace `fetch('/api/v1/auth/reset', { method:'POST' })` con `{ token, new_password }`; muestra éxito y CTA "Ir a iniciar sesión".

## Flujo de interaccion (secuencial)

1. Usuario llega a `/reset/:token` con token válido.
2. Ve form + medidor de fuerza.
3. Tipea password; medidor actualiza en tiempo real.
4. Submit → `fetch` POST.
5. Endpoint valida Zod → si falla, 422 con detalle; cliente muestra error inline.
6. Endpoint hashea + UPDATE + `kv.delete(token)` + side-effect HU-19.4.
7. Si todo OK, 200; cliente redirige a `/login?reset=ok`.
8. Si token ya usado, KV lo retorna null → 410; cliente muestra error.

## Capa de servicios

```ts
// src/lib/services/auth/hash.ts
export async function hashPassword(plain: string): Promise<string>;   // argon2id
export async function verifyPassword(plain: string, hash: string): Promise<boolean>;

// src/lib/services/auth/reset-token.ts (ampliar)
export async function consumeResetToken(
  deps: { kv: KVNamespace; db: Db; emailService: EmailService },
  input: { token: string; newPassword: string },
): Promise<{ userId: number } | { error: 'invalid_token' | 'weak_password' | 'reused' }>;

// src/lib/services/auth/sessions.ts (nuevo, consumido por HU-19.4; firma declarada aquí para DI)
export async function revokeAllSessions(userId: number, deps: { kv: KVNamespace }): Promise<number>;
```

`consumeResetToken` orquesta:
1. `kv.get('pwreset:'+token)`; null → `invalid_token`.
2. `verifyPassword(newPassword, currentHash)`; true → `reused`.
3. UPDATE `users SET password_hash = newHash WHERE id = userId`.
4. `kv.delete('pwreset:'+token)`.
5. `revokeAllSessions(userId, { kv })` (side-effect HU-19.4).
6. Si paso 5 falla → restaurar hash previo (rollback) + rethrow.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/validators/auth.test.ts` (extender) | `newPasswordSchema` casos: min 10, mayúscula, número, símbolo; rechaza "1234" con detalles |
| Unit | `tests/unit/auth/hash.test.ts` | `hashPassword` + `verifyPassword` round-trip; `verifyPassword` con password incorrecto retorna false |
| Unit | `tests/unit/components/password-strength.test.ts` | el script calcula score; renderiza barra con clase correcta según score |
| Integracion | `tests/integration/auth/reset-confirm.test.ts` | happy path: token vigente + password fuerte → 200 + UPDATE + KV delete; weak password → 422; reused → 422; token inexistente → 410; rollback si revoke falla |

## Dependencias y secuencia

- **Bloqueado por:** HU-19.1 (token en KV), HU-19.2 (validación previa). REQ-01 (users schema con `password_hash`).
- **Bloquea a:** HU-19.4 (HU-19.3 lo llama como side-effect).
- **Recursos compartidos:** `Astro.locals.runtime.env.SESSION`, `src/database/schema.ts`.

## Riesgos tecnicos

- Riesgo: argon2 WASM no carga en el runtime de Cloudflare → Mitigación: `@node-rs/argon2` declara soporte para Workers; test integración con miniflare valida el round-trip.
- Riesgo: el medidor de fuerza filtra la contraseña (regex match visible) → Mitigación: el cálculo es client-side; no se envía al server hasta el submit; tests verifican que no hay `fetch` durante el typing.
- Riesgo: race entre UPDATE y `kv.delete` puede dejar el token válido por una ventana → Mitigación: hacer `kv.delete` ANTES del UPDATE; si el UPDATE falla, devolver 500 pero el token ya está consumido. Decisión aceptable porque el usuario re-intenta con un nuevo request.
