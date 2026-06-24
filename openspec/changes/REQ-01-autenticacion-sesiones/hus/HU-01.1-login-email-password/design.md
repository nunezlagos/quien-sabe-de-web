# Diseño técnico — HU-01.1 — Registro e inicio de sesión con email + contraseña

**REQ padre:** REQ-01-autenticacion-sesiones

## Modelo de datos

### Tabla Drizzle (extracto referencial)

```ts
// src/database/schema.ts (extracto)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),                  // correo en DB
  name: text('name').notNull(),                             // nombre
  passwordHash: text('password_hash').notNull(),            // pbkdf2$200000$<salt>$<hash>
  role: text('role', { enum: ['user', 'provider', 'admin'] }).notNull().default('user'),
  status: text('status', { enum: ['active', 'banned'] }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
```

### Migración Drizzle

- Archivo: `src/database/migrations/0002_users_password.sql`.
- Cambio: `ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';`.
- Decisión MVP: las filas existentes (si las hay) reciben `''` y se
  bloquean al intentar login; no hay backfill automático en esta HU.
- Constraint: `CHECK (length(password_hash) > 0)` se agrega en una
  migración posterior (post-MVP) cuando se decida el flujo de
  reseteo para cuentas legacy.

## Contrato de API

### `POST /api/v1/auth/registro` [público]

Request:
```json
{
  "nombre": "Ana",
  "correo": "ana@ejemplo.cl",
  "contrasena": "Secreta123!"
}
```

Response 201:
```json
{
  "usuario": {
    "id": 42,
    "nombre": "Ana",
    "correo": "ana@ejemplo.cl",
    "rol": "user"
  }
}
```

Errores:
- 400 — validación Zod (contraseña débil, email mal formado, campos
  faltantes).
- 409 — `{ "error": "correo ya registrado" }`.
- 500 — error interno.

### `POST /api/v1/auth/iniciar-sesion` [público]

Request:
```json
{
  "correo": "ana@ejemplo.cl",
  "contrasena": "Secreta123!"
}
```

Response 200:
```json
{
  "usuario": { "id": 42, "nombre": "Ana", "correo": "ana@ejemplo.cl", "rol": "user" }
}
```

Errores:
- 400 — body inválido.
- 401 — `{ "error": "credenciales inválidas" }` (mismo mensaje
  siempre; anti-enumeración).
- 403 — `{ "error": "cuenta deshabilitada" }` si `status='banned'`.

Ambos endpoints emiten
`Set-Cookie: sesion=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<TTL_SEGundos>`.
`TTL_SEGundos` se lee de `env.SESSION_TTL_SECONDS` (default 2 592 000
= 30 días). En dev `Secure` se omite si `PUBLIC_SITE_URL` empieza con
`http://`.

## Validaciones Zod

```ts
// src/lib/validators/autenticacion.ts
import { z } from 'zod'

export const RegistroCuerpo = z.object({
  nombre: z.string().min(2).max(120),
  correo: z.string().email().max(255).toLowerCase(),
  contrasena: z.string()
    .min(8, 'mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'falta mayúscula')
    .regex(/[0-9]/, 'falta número'),
})

export const InicioSesionCuerpo = z.object({
  correo: z.string().email().max(255).toLowerCase(),
  contrasena: z.string().min(1).max(128),
})

export type RegistroCuerpoInferido = z.infer<typeof RegistroCuerpo>
export type InicioSesionCuerpoInferido = z.infer<typeof InicioSesionCuerpo>
```

## Componentes UI

- Vista `src/pages/iniciar-sesion.astro` — formulario email/contraseña
  + link "¿No tienes cuenta? Regístrate". Placeholders OAuth se
  difieren a HU-01.3/01.4.
- Vista `src/pages/registro.astro` — formulario con campos
  nombre/correo/contraseña + link "Ya tienes cuenta? Inicia sesión".
- Helper `establecerCookieSesion(cookies, token, ttlSegundos)` en
  `src/lib/utils/cookies.ts`.

## Flujo de interacción (secuencial)

### Registro
1. Cliente envía `POST /api/v1/auth/registro` con body validado por
   Zod (400 si falla).
2. Server hashea contraseña con PBKDF2
   (`hashContrasena(contrasena) → "pbkdf2$200000$<saltB64>$<hashB64>"`).
3. `INSERT INTO users (email, name, password_hash, role)` con captura
   de error UNIQUE → 409 si duplicado.
4. Server llama `crearSesion(env, usuario)` (HU-01.2) → escribe
   `sesion:<token>` en KV → emite cookie.
5. Responde 201 con `{ usuario }` (sin `password_hash`).

### Inicio de sesión
1. Cliente envía `POST /api/v1/auth/iniciar-sesion` con body validado
   por Zod (400 si falla).
2. Server hace `findUserByEmail(db, correo)`.
3. Si no existe O `verificarContrasena(hash, contrasena) === false` O
   `status !== 'active'` → 401 con mensaje único.
4. Server llama `crearSesion` → emite cookie.
5. Responde 200 con `{ usuario }`.

## Capa de servicios

- `src/lib/services/auth/contrasena.ts`:
  - `ITERACIONES_PBKDF2 = 200_000`
  - `LONGITUD_SALT_BYTES = 16`
  - `LONGITUD_HASH_BYTES = 32`
  - `hashContrasena(plain: string): Promise<string>` — genera salt,
    deriva bits, devuelve `pbkdf2$200000$<saltB64>$<hashB64>`.
  - `verificarContrasena(hashAlmacenado: string, plain: string): Promise<boolean>`
    — parsea, re-deriva con el salt guardado, compara con
    `timingSafeEqual`.
- `src/lib/services/auth/usuarios.ts`:
  - `crearUsuario(db, {nombre, correo, contrasenaHash}): Promise<Usuario>`
    — captura UNIQUE violation → `CorreoYaRegistradoError`.
  - `buscarUsuarioPorCorreo(db, correo): Promise<Usuario | null>`.
- `src/lib/services/auth/sesion.ts` (interfaz; implementación real en
  HU-01.2):
  - `crearSesion(env, usuario): Promise<{ token: string; ttlSegundos: number }>`
    — genera token opaco (32 bytes hex), escribe `sesion:<token>`
    en KV con TTL.

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/contrasena.test.ts` | hash distinto para mismo input (salt aleatorio), verify ok, verify ko con contraseña alterada, formato `pbkdf2$200000$…`, comparación constant-time, malformed hash retorna false. |
| Unit | `tests/unit/validators/autenticacion.test.ts` | RegistroCuerpo rechaza contraseña corta, sin mayúscula, sin número, email mal formado; InicioSesionCuerpo acepta body mínimo. |
| Integración | `tests/integration/auth/registro.test.ts` | 201 válido (cookie emitida + fila en `users`), 409 correo duplicado, 400 contraseña débil. |
| Integración | `tests/integration/auth/iniciar-sesion.test.ts` | 200 + cookie válida, 401 contraseña incorrecta, 401 correo inexistente con MISMO cuerpo (anti-enumeración), 403 cuenta baneada. |
| E2E | `tests/e2e/flujo-auth.spec.ts` | Registro → dashboard → cerrar sesión → `/` sin sesión. |

## Dependencias y secuencia

- **Bloqueado por:** — (primera HU de REQ-01).
- **Bloquea a:** HU-01.2 (sesión), HU-01.5 (cerrar sesión), HU-01.6
  (`/yo`), REQ-02 (onboarding), REQ-11/12 (dashboards).
- **Recursos compartidos:** tabla `users`, binding `SESSION` (KV),
  `src/database/schema.ts`, `@cloudflare/vitest-pool-workers`.

## Riesgos técnicos

- Riesgo: Web Crypto `subtle.deriveBits` no disponible en runtime de
  tests → Mitigación: `vitest-pool-workers` expone `crypto.subtle`;
  tests unitarios mockean con `node:crypto.webcrypto` como fallback
  vía setup file.
- Riesgo: contraseñas hasheadas sin pepper → Mitigación: documentar
  `AUTH_PASSWORD_PEPPER` como mejora post-MVP; en MVP se acepta sin
  pepper porque PBKDF2 + salt aleatorio cubre el caso base.
- Riesgo: timing attack al comparar hash precomputado con DB →
  Mitigación: `timingSafeEqual` aplicado tras check de longitud.
- Riesgo: contraseñas vacías en legacy (`DEFAULT ''`) → Mitigación:
  `verificarContrasena` retorna false si el hash no tiene el formato
  esperado, bloqueando el login hasta backfill (post-MVP).