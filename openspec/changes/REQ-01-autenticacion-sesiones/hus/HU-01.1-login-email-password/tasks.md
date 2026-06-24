# HU-01.1 — Registro e inicio de sesión con email + contraseña

**Estado:** planned → ready
**Prioridad:** P0
**REQ padre:** REQ-01-autenticacion-sesiones
**Rama:** `feat/HU-01.1-registro-inicio-sesion`

## Tareas técnicas

- [ ] **T1** Agregar columna `passwordHash` (TEXT NOT NULL DEFAULT '') a `users` en `src/database/schema.ts`.
- [ ] **T2** Generar migración `docker exec quien-sabe-app bun run db:generate` → `src/database/migrations/0002_users_password.sql` con `ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`.
- [ ] **T3** Aplicar migración local: `docker exec quien-sabe-app bun run db:migrate:local`. Verificar con `make studio`.
- [ ] **T4** Helper `src/lib/services/auth/contrasena.ts` exportando `ITERACIONES_PBKDF2=200_000`, `LONGITUD_SALT_BYTES=16`, `hashContrasena(plain)`, `verificarContrasena(hashAlmacenado, plain)` usando Web Crypto `crypto.subtle.deriveBits`. Formato `pbkdf2$<iter>$<saltB64>$<hashB64>`. Comparación con `timingSafeEqual` (helper en `src/lib/utils/timing.ts`).
- [ ] **T5** Schemas Zod `RegistroCuerpo` y `InicioSesionCuerpo` en `src/lib/validators/autenticacion.ts`. Mensajes de error en español.
- [ ] **T6** Helper `src/lib/utils/cookies.ts` con `establecerCookieSesion(cookies, token, ttlSegundos)` y `limpiarCookieSesion(cookies)`. Flags `HttpOnly; Secure; SameSite=Lax; Path=/`. `Secure` se omite si `PUBLIC_SITE_URL` empieza con `http://`.
- [ ] **T7** Helper `src/lib/utils/timing.ts` con `timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean` constant-time.
- [ ] **T8** Servicio `src/lib/services/auth/usuarios.ts` con `crearUsuario(db, {nombre, correo, contrasenaHash})` (captura UNIQUE → lanza `CorreoYaRegistradoError`) y `buscarUsuarioPorCorreo(db, correo)`.
- [ ] **T9** Interfaz `src/lib/services/auth/sesion.ts` con `crearSesion(env, usuario): Promise<{token, ttlSegundos}>`. Genera token 32 bytes hex (`crypto.getRandomValues`), escribe `sesion:<token>` en KV con TTL. Stub suficiente para esta HU; HU-01.2 completa la integración con middleware.
- [ ] **T10** Helper de respuesta JSON `src/lib/utils/respuesta.ts` con `respuestaJson(body, init?)`, `respuestaError(mensaje, status)` para reducir boilerplate.
- [ ] **T11** Endpoint `src/pages/api/v1/auth/registro.ts` (POST):
  - Parsea JSON + Zod → 400 si falla.
  - `hashContrasena` + `crearUsuario` → 409 si duplicado.
  - `crearSesion` + `establecerCookieSesion`.
  - 201 con `{usuario}` (sin `passwordHash`).
- [ ] **T12** Endpoint `src/pages/api/v1/auth/iniciar-sesion.ts` (POST):
  - Parsea JSON + Zod → 400 si falla.
  - `buscarUsuarioPorCorreo` → 401 con mensaje único si null O `status !== 'active'` O `!verificarContrasena`.
  - `crearSesion` + `establecerCookieSesion`.
  - 200 con `{usuario}`.
- [ ] **T13** Vista `src/pages/registro.astro` — formulario con campos `nombre`, `correo`, `contrasena`. Submit hace `fetch('/api/v1/auth/registro', {method:'POST'})`, redirige a `/dashboard` en éxito. Copy y validación inline en español.
- [ ] **T14** Vista `src/pages/iniciar-sesion.astro` — formulario con `correo`, `contrasena`. Submit hace fetch a `/api/v1/auth/iniciar-sesion`. Link "¿No tienes cuenta? Regístrate".
- [ ] **T15** Actualizar `src/pages/index.astro` a español (copy, CTAs: "Buscar" → "Buscar", "Search" → etc.). Botones de auth según sesión.
- [ ] **T16** Tests:
  - [ ] `tests/unit/auth/contrasena.test.ts` — hash distinto para mismo input (salt aleatorio), verify ok, verify ko con contraseña alterada, formato `pbkdf2$200000$…`, comparación constant-time, malformed hash retorna false.
  - [ ] `tests/unit/validators/autenticacion.test.ts` — RegistroCuerpo rechaza contraseña corta, sin mayúscula, sin número, email mal formado; InicioSesionCuerpo acepta body mínimo.
  - [ ] `tests/unit/utils/timing.test.ts` — `timingSafeEqual` retorna true/false correctamente.
  - [ ] `tests/integration/auth/registro.test.ts` — 201 válido (cookie emitida + fila en `users`), 409 correo duplicado, 400 contraseña débil.
  - [ ] `tests/integration/auth/iniciar-sesion.test.ts` — 200 + cookie válida, 401 contraseña incorrecta, 401 correo inexistente con MISMO cuerpo (anti-enumeración), 403 cuenta baneada.
  - [ ] `tests/e2e/flujo-auth.spec.ts` — registro → dashboard → cerrar sesión → `/` sin sesión.

## Definition of done

- [ ] Tests `bunx vitest run` → verde
- [ ] Tests E2E → verde
- [ ] Sabotaje confirmado (mínimo 2):
  - [ ] Cambiar `timingSafeEqual` por `===` (comparación naive) → test de `verificarContrasena` con strings distintos de misma longitud detecta diferencia de tiempo > umbral → restaurar
  - [ ] Cambiar mensaje de error en iniciar-sesion a `"correo no existe"` cuando `buscarUsuarioPorCorreo` retorna null → test anti-enumeración cae → restaurar
  - [ ] Quitar flag `HttpOnly` de `establecerCookieSesion` → test que inspecciona flags de cookie cae → restaurar
- [ ] Coverage ≥ 90% en `src/lib/services/auth/contrasena.ts` y `src/lib/services/auth/usuarios.ts`
- [ ] Type check: `docker exec quien-sabe-app bunx tsc --noEmit` → verde (queda para CI)
- [ ] Commit con `feat:` y push a rama `feat/HU-01.1-registro-inicio-sesion` (no merge a main sin review)