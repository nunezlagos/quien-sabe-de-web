# HU-19.3 — Confirmar nuevo password usando token

**Estado:** planificada | **Prioridad:** P0 | **REQ padre:** REQ-19-recuperacion-password

## Historia de usuario

**Como** usuario con token vigente
**Quiero** establecer un nuevo password
**Para** restaurar el acceso a mi cuenta

## Criterios de aceptación (Gherkin)

### Escenario: Reset exitoso
  Dado token vigente `abc123` para user_id=42
  Cuando envío `POST /api/v1/auth/reset` con `{"token":"abc123","new_password":"S3gur@Pass!"}`
  Entonces recibo status 200
  Y `users.password_hash` cambia
  Y el key KV `pwreset:abc123` queda eliminado (un solo uso)

### Escenario: Password débil → 422
  Cuando envío password "1234"
  Entonces recibo status 422 con detalle Zod (min 10, requiere mayúscula+número)

### Escenario: Reutilizar token → 410
  Dado token ya usado
  Cuando envío POST con ese token
  Entonces recibo status 410

### Escenario: UI con indicador de fuerza
  Cuando escribo el password en `/reset/:token`
  Entonces se muestra barra de fuerza (débil/media/fuerte) reutilizando paleta verde primary `#2E8B57`

## Tareas técnicas

- [ ] Endpoint `src/pages/api/v1/auth/reset.ts` con Zod `{ token, new_password }`
- [ ] Hash con `argon2id` vía `src/lib/services/auth/hash.ts`
- [ ] Eliminar key KV tras éxito (`SESSION.delete("pwreset:<token>")`)
- [ ] Componente `<PasswordStrengthMeter />` en `src/components/auth/PasswordStrengthMeter.astro`
- [ ] Disparar HU-19.4 (invalidar sesiones) como side-effect
- [ ] Tests `tests/integration/auth/reset-confirm.test.ts`

## Definition of done

- [ ] Tests Vitest unit pasan
- [ ] Tests Vitest integración pasan (`@cloudflare/vitest-pool-workers` contra D1/R2/KV)
- [ ] Test E2E Playwright pasa
- [ ] Sabotaje confirmado: romper la fix → un test rojo verificable → restaurar
- [ ] Coverage ≥ 90 % en el módulo afectado
- [ ] Type check verde: `docker exec quien-sabe-app bunx tsc --noEmit`
- [ ] PR mergeado a `main` vía `/respaldo`
