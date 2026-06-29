# Diseño técnico — HU-20.2 — Confirmar email con token

**REQ padre:** REQ-20-verificacion-email-post-registro

## Modelo de datos

### Tablas Drizzle (pseudocódigo)

```ts
// src/database/schema.ts (extracto; columna ya creada por HU-20.1)
export const users = sqliteTable('users', {
  // ... columnas existentes
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }), // nullable
})
```

### Migración Drizzle

No requiere nueva migración. Reutiliza la creada en HU-20.1.

### KV

- Lectura: `email_verify:<token>` → `{ user_id, expires_at }`.
- Tras confirmar exitoso: borrar `email_verify:<token>` y `email_verify_user:<user_id>`.

## Contrato de API

| Endpoint | Método | Auth | Request body | Response 200 | Errores |
|---|---|---|---|---|---|
| `/api/v1/auth/verify-email/:token` | GET | público | — (token en path) | `{ verified: true, already_verified?: boolean, user_id: number }` | 400 (token mal formado), 410 (token inexistente o expirado), 500 |

Comportamiento idempotente: si el `user_id` resuelto desde KV tiene `email_verified_at != null`, responde 200 con `already_verified: true` y elimina el token KV para limpieza.

## Validaciones Zod

```ts
// src/lib/validators/auth.ts (pseudocódigo)
export const verifyTokenParamSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/),
})
```

## Componentes UI

### Páginas Astro

- `src/pages/verify-email/[token].astro` — landing pública SSR.
  - Mockup base: `mockups/verify-email.html:42-89` (estructura `main.container.max-w-md`).
  - Flujo: lee `Astro.params.token`, llama internamente al servicio (no HTTP) `verifyEmailService.confirm(token)`, decide estado a renderizar.
  - Estados renderizables:
    - Éxito → `mockups/verify-email.html:58-71` (botón "Ir a mi dashboard" apuntando a `/dashboard-user`).
    - Expirado → `mockups/verify-email.html:73-87` (botón "Reenviar email" que abre formulario de POST a `/api/v1/auth/verify-email/resend` si hay sesión; si no, redirige a `/login?next=/verify-email/resend`).
  - Layout base reutilizado: `src/layouts/BaseLayout.astro` (navbar + footer del sitio).

### Componentes Astro reutilizables

- `src/components/auth/VerifyEmailCard.astro` — props `{ state: 'success' | 'expired', userId?: number }`.
  - Mockup base: `mockups/verify-email.html:59-71` (success) y `mockups/verify-email.html:74-87` (expired).
  - Islas requeridas: no para success; sí mínima para expired si se quiere POST en cliente (alternativamente, un `<form method="POST">` clásico evita la isla).

## Flujo de interacción (secuencial)

1. Usuario hace clic en el link del correo (generado en HU-20.1) → `GET /verify-email/<token>`.
2. La página `[token].astro` corre en el servidor y llama a `verifyEmailService.confirm(token)`.
3. Servicio valida formato con Zod (`verifyTokenParamSchema`).
4. Servicio lee `email_verify:<token>` en KV.
   - Si no existe → throw `TokenExpiredError`.
5. Servicio lee `users` por `user_id` extraído del KV.
   - Si `email_verified_at != null` → borra KV, retorna `{ alreadyVerified: true, userId }`.
   - Si `email_verified_at == null` → `UPDATE users SET email_verified_at = NOW()` y borra KV.
6. Página renderiza `VerifyEmailCard` con estado `success` (líneas mockup 59-71).
7. Si paso 4 lanza `TokenExpiredError` → renderiza `VerifyEmailCard` con estado `expired` (líneas mockup 74-87) y status HTTP 410 en headers.

## Capa de servicios

- `src/lib/services/auth/email-verify.ts` (compartido con HU-20.1)
  - `confirm(token: string) -> Promise<{ userId: number; alreadyVerified: boolean }>`
  - `revokeToken(token: string) -> Promise<void>` (privado, llamado desde `confirm`)

## Tests planificados

| Capa | Archivo | Foco |
|---|---|---|
| Unit | `tests/unit/auth/email-verify-confirm.test.ts` | Lógica del servicio: token válido, expirado, ya verificado |
| Unit | `tests/unit/validators/verify-token-param.test.ts` | Regex 64 hex acepta/rechaza correctamente |
| Integración | `tests/integration/auth/verify-email-confirm.test.ts` | Endpoint GET → 200 + `email_verified_at` set; 410 token inexistente |
| E2E | `tests/e2e/confirmar-email-flujo.spec.ts` | Registro → captura URL en Mailpit → visita → ve botón "Ir a mi dashboard" |

## Dependencias y secuencia

- **Bloqueado por:** HU-20.1 (necesita tokens emitidos en KV).
- **Bloquea a:** HU-20.4 (la verificación de `email_verified_at` es la salida de este endpoint).
- **Recursos compartidos:** binding KV `SESSION`, binding D1, layout `BaseLayout.astro`.

## Riesgos técnicos

- Riesgo: race condition entre dos clicks rápidos del mismo link. Mitigación: `UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?)` para no sobreescribir, y respuesta consistente.
- Riesgo: tokens con caracteres no hex. Mitigación: Zod rechaza ANTES de tocar KV → 400.
- Riesgo: el botón "Reenviar email" del estado Expirado podría no tener sesión activa. Mitigación: la página detecta sesión; si no hay, deshabilita el botón y muestra link "Inicia sesión para reenviar" (override mínimo del copy del mockup, fuera de la zona crítica).
