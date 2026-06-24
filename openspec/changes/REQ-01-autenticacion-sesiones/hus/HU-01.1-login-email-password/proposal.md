# Propuesta — HU-01.1 — Registro e inicio de sesión con email + contraseña

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

REQ-01 define el primer punto de entrada a la plataforma. Antes de
cualquier ruta privada, vecinos y prestadores necesitan poder
registrarse e iniciar sesión sin depender de un proveedor social. Esta
HU cubre el camino nativo: email + contraseña con hash PBKDF2,
validación Zod del body, escritura en D1 (`users`) y emisión de la
cookie `sesion`. Habilita a HU-01.2 (sesión KV) y desbloquea el MVP
de autenticación sin OAuth ni email.

## Mockups de referencia

- No existe mockup de login/registro. **Mockup TBD** — esta HU crea
  los formularios `/iniciar-sesion` y `/registro`. La vista de éxito
  post-login se apoya en `mockups/dashboard-user.html:1-50` como
  destino de la redirección.

## Alternativas consideradas

### Opción A — PBKDF2 nativo vía Web Crypto API + cookie server-set
- Hash con `crypto.subtle.deriveBits` (PBKDF2, SHA-256, ≥200 000
  iteraciones, salt de 16 bytes aleatorio por usuario).
- Pro: Web Crypto está disponible en runtime de Workers sin
  dependencias nativas; portable; cumple NIST SP 800-132.
- Pro: Cookie `HttpOnly` mitiga exfiltración XSS del token.
- Pro: zero deps, ningún native binding que rompa el bundle de
  Cloudflare.
- Contra: PBKDF2 es menos resistente a GPU que argon2id, pero las
  200k iteraciones + salt por usuario lo dejan lejos del espacio
  inseguro para la escala esperada.

### Opción B — Argon2id vía `@node-rs/argon2`
- Pro: OWASP gold standard 2026.
- Contra: native binding frágil en `workerd`/Workers; añade peso al
  bundle y posibles incompatibilidades en CI Docker.

### Opción C — bcryptjs (puro JS)
- Pro: portabilidad total.
- Contra: bcrypt trunca a 72 bytes (rompe passphrases largas); más
  lento por hash que PBKDF2 en Workers; menos resistencia a GPU.

## Decisión

Se elige **Opción A** para el MVP por portabilidad y zero-deps. La
migración a argon2id queda documentada como mejora post-MVP si el
perfil de amenaza escala (REQ pendiente). Validación con Zod
`RegistroCuerpo` y `InicioSesionCuerpo` antes de cualquier acceso a
DB. La latencia de PBKDF2 es ~150-200ms en Workers, aceptable
porque el endpoint no es hot-path.

## Riesgos y mitigaciones

- Riesgo: timing attack en comparación de hash → Mitigación:
  comparación manual con `timingSafeEqual` (longitudes distintas
  retornan false sin tocar bytes).
- Riesgo: enumeración de usuarios vía distinto mensaje en `correo
  duplicado` vs `credenciales inválidas` → Mitigación: el escenario
  de login devuelve siempre `credenciales inválidas` (Gherkin
  "anti-enumeración").
- Riesgo: contraseña débil en producción → Mitigación: Zod regex
  exige mínimo 8, una mayúscula, un número; feedback al cliente vía
  400 con detalle de reglas no cumplidas.
- Riesgo: race condition en doble `registro` simultáneo →
  Mitigación: `UNIQUE(email)` en D1 + manejo de error como 409.
- Riesgo: PBKDF2 con iteraciones bajas si se baja la config →
  Mitigación: constante `PBKDF2_ITERATIONS = 200_000` exportada y
  testeada; tests verifican que el hash incluye el conteo correcto.

## Métrica de éxito

- `POST /api/v1/auth/registro` con correo nuevo devuelve 201 y fila
  en `users` con `password_hash` formato `pbkdf2$<iter>$<saltB64>$<hashB64>`.
- Re-registro con mismo correo devuelve 409 sin filtrar si la
  contraseña era la correcta.
- `POST /api/v1/auth/iniciar-sesion` con credenciales válidas
  devuelve 200 y cookie con flags `HttpOnly; Secure; SameSite=Lax`.
- Tests unit + integración + E2E verde; coverage ≥ 90% en
  `src/lib/services/auth/contrasena.ts`.