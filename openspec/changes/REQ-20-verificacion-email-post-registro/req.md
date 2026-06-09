# REQ-20-verificacion-email-post-registro

**Estado:** activo
**Creado:** 2026-06-09
**Vinculado a:** OE1

## Descripción

Al registrarse un usuario (REQ-02) se envía email con token de verificación.
Hasta confirmar, el usuario puede navegar pero NO puede dejar reseñas,
contactar prestadores ni publicar perfil PRO. Banner persistente en
dashboard hasta verificar.

## Criterios de éxito

- [ ] Email enviado automáticamente al crear cuenta.
- [ ] Endpoint de confirmación marca `users.email_verified_at = NOW()`.
- [ ] Botón "Reenviar" con rate-limit 1 cada 5 min, 5 por día.
- [ ] Acciones críticas (POST reviews, POST contact, POST providers/me)
      retornan 403 con `{ "error": "email no verificado" }` si falta.
- [ ] Banner visible en `dashboard-user` hasta verificar.

## UI pendiente

Mockup no existe. Diseñar:

- `/verify-email/:token` — landing con feedback estilo `mockups/profile.html`
  (sección error línea 153). Verde si OK, rojo si expiró.
- Banner en `dashboard-user.html` que se inserta encima del bloque
  "¡Hola, Vecino!" (línea 29). Reutilizar pattern de aviso visto en
  `mockups/profile.html:120-122` (bg-blue-50, ri-information-line) pero en
  amarillo `bg-yellow-50` con `ri-error-warning-line`.

## Superficie técnica

### Endpoints API
- `GET  /api/v1/auth/verify-email/:token` — confirma [público]
- `POST /api/v1/auth/verify-email/resend` — reenvía [sesión]

### Vistas Astro
- `/verify-email/[token]`

### Tablas Drizzle
- `users.email_verified_at` (nullable timestamp).
- KV `email_verify:<token>` → `{user_id, expires_at}` TTL 24h.

### Bindings Cloudflare
- `D1`, `SESSION` (KV), SES/Mailpit

## HUs hijas (plan)

| HU | Slug | Descripción | Prioridad |
|----|------|-------------|-----------|
| HU-20.1 | envio-email-verificacion | Hook tras registro → encola email | P0 |
| HU-20.2 | endpoint-confirmar-email | GET marca verified_at | P0 |
| HU-20.3 | reenviar-email | POST con rate-limit | P1 |
| HU-20.4 | banner-email-no-verificado | UI + gate en endpoints críticos | P0 |

## Tests requeridos

- **Unit:** generador token, validador Zod.
- **Integración:** registro → email en `email_log`; token expirado → 410;
  endpoint protegido sin verify → 403.
- **E2E:** vecino registra → recibe Mailpit → clic link → puede reseñar.

## Dependencias

- **Depende de:** REQ-01, REQ-02, REQ-17
- **Habilita a:** REQ-09 (gate reseñas), REQ-21

## Riesgos / suposiciones

- Permitir login sin verificar (sólo bloquear escrituras críticas) para no
  obstaculizar onboarding.
