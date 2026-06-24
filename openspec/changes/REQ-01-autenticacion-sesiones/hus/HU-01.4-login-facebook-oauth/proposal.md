# Propuesta — HU-01.4 — Login con Facebook OAuth

**Estado:** propuesta | **REQ padre:** REQ-01-autenticacion-sesiones

## Contexto

Complemento de HU-01.3: vecinos y prestadores con cuenta Facebook también deben poder iniciar sesión sin contraseña. Esta HU reusa el endpoint genérico `[provider]` y la máquina de state/PKCE ya implementada; sólo cambia el helper del provider (URL de Facebook Graph API, formato de `access_token`, validación de `email`). La tabla `oauth_accounts` ya contempla `provider='facebook'` desde HU-01.3.

## Mockups de referencia

- No existe mockup para OAuth. **Mockup TBD** — el botón "Continuar con Facebook" se coloca en las mismas vistas que el de Google (HU-01.3). Sin mockup dedicado.

## Alternativas consideradas

### Opcion A — Authorization Code contra Facebook Graph v18.0, reuso del endpoint genérico
- Facebook devuelve `access_token` (no `id_token`); se intercambia por datos de usuario via `https://graph.facebook.com/me?fields=id,name,email&access_token=<token>`.
- Helper `facebook.ts` implementa sólo las 3 funciones específicas del provider: `buildAuthorizationUrl`, `exchangeCode`, `getProfile`.
- Estado PKCE en KV con TTL 600s (mismo que Google).
- Pro: reuso total del flujo `state → callback → upsert → createSession`.
- Pro: si Facebook no devuelve email → error 400 explícito (controlado, sin crear user "huérfano").

### Opcion B — Facebook Login SDK client-side + token al server
- Pro: SDK simplifica captura.
- Contra: requiere app_id expuesta, agrega JS de Facebook al bundle, complica CSP. No compensa para nuestro flujo.

### Opcion C — Saltarse Facebook y solo soportar Google
- Pro: menos código, menos superficie de bug.
- Contra: pierde una fracción de usuarios (en Chile es menor que Google pero existe; en segmentos etarios 40+ es notable).

## Decision

Se elige **Opcion A**. Reuso del endpoint genérico + helper específico del provider. Costo incremental mínimo: ~80 LOC en `facebook.ts` + tests. Cubre a un segmento de usuarios real.

## Riesgos y mitigaciones

- Riesgo: Facebook devuelve email `null` cuando el usuario no lo autorizó → Mitigación: 400 `email requerido por Facebook`; nunca crear user sin email (rompería el modelo y el UNIQUE).
- Riesgo: email de Facebook es `protonmail.com` temporal vs Google con dominio verificado → Mitigación: la asociación por email sigue el mismo criterio que Google (lowercase + match exacto).
- Riesgo: app de Facebook en modo "Development" solo permite testers → Mitigación: documentar en `wrangler.toml.example` el flujo para añadir testers y promover a "Live".

## Metrica de exito

- `GET /api/v1/auth/oauth/facebook` responde 302 hacia `https://www.facebook.com/v18.0/dialog/oauth?...` con `state`.
- Callback con email presente → crea/asociar cuenta y emite sesión.
- Callback sin email → 400 `email requerido por Facebook`.
- Callback con state inválido → 400.
- Tests unit + integración verde; coverage ≥ 90% en `src/lib/services/auth/oauth/facebook.ts`.
