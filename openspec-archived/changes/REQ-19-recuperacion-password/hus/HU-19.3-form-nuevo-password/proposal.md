# Propuesta — HU-19.3 — Confirmar nuevo password usando token

**Estado:** propuesta | **REQ padre:** REQ-19-recuperacion-password

## Contexto

Con el token validado por HU-19.2, el usuario está en `/reset/:token` viendo
el form. Esta HU implementa el submit: endpoint `POST /api/v1/auth/reset`
que recibe `{ token, new_password }`, valida la fortaleza (min 10,
mayúscula, número, carácter especial), hashea con `argon2id`, actualiza
`users.password_hash`, elimina la key KV (un solo uso) y dispara la
invalidación de sesiones (HU-19.4). La UI muestra un indicador de fuerza
del password en tiempo real mientras el usuario tipea.

## Mockups de referencia

- `mockups/reset-password.html:28-74` — card de form con input password,
  confirmación y panel de requisitos con checks verde/rojo (líneas 52-68).
  El patrón de lista de requisitos se reusa para el medidor de fuerza.

## Alternativas consideradas

### Opcion A — argon2id para hash + endpoint con Zod estricto
- `hashPassword(plain)` y `verifyPassword(plain, hash)` con `@node-rs/argon2` (rápido, edge-compatible).
- Zod con `.regex()` que exige mayúscula, minúscula, número y símbolo; min 10.
- Pro: argon2id es el estándar actual para password hashing; edge runtime lo soporta vía WASM.
- Pro: Zod da mensajes de error específicos.
- Contra: `@node-rs/argon2` requiere WASM; verificar bundle size.

### Opcion B — bcrypt
- Pro: ubiquitous.
- Contra: bcrypt es CPU-intensive y no ideal para edge; argon2id es preferible para nuevos proyectos.

### Opcion C — scrypt de node:crypto
- Sin dependencias externas.
- Pro: 0 deps.
- Contra: API menos cómoda; argon2id tiene mejor protección contra GPU attacks.

## Decision

Se elige **Opcion A**. argon2id es el estado del arte y `@node-rs/argon2`
compila a WASM compatible con Workers. La validación Zod cubre los
requisitos.

## Riesgos y mitigaciones

- Riesgo: WASM de argon2 infla el bundle significativamente → Mitigación: medir bundle size; si supera 200KB, considerar `hash-wasm` o `scrypt` (decisión diferida).
- Riesgo: el usuario usa el mismo password que tenía antes → Mitigación: REQ-01 puede haber guardado un hash previo; HU-19.3 compara con `verifyPassword` antes de aceptar y rechaza con 422 si coincide.
- Riesgo: race entre HU-19.3 y HU-19.4 (sesiones no revocadas si falla) → Mitigación: HU-19.4 es un side-effect disparado por HU-19.3 después del UPDATE; si falla, HU-19.3 hace rollback del hash. Tests verifican atomicidad.

## Metrica de exito

- `POST /api/v1/auth/reset` con token vigente + `S3gur@Pass!` → 200, `users.password_hash` cambia, key KV `pwreset:<token>` eliminada.
- Password débil ("1234") → 422 con detalle Zod.
- Token ya usado → 410.
- UI muestra barra de fuerza: "débil" (< 8 efectivo), "media" (cumple Zod pero score bajo), "fuerte" (cumple Zod + extra).
