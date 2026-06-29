# Propuesta — HU-20.2 — Confirmar email con token

**Estado:** propuesta | **REQ padre:** REQ-20-verificacion-email-post-registro

## Contexto

El usuario hace clic en el link del email enviado por HU-20.1 y aterriza en `/verify-email/<token>`. Esta HU implementa el endpoint que valida el token, marca `users.email_verified_at` y la vista Astro que muestra el resultado al vecino. Sin esta confirmación, los gates de HU-20.4 dejan al usuario bloqueado para reseñar o contactar, así que es P0 para OE1.

## Mockups de referencia

- `mockups/verify-email.html:46-56` — Estado 1 "Verificando" (spinner verde + título "Verificando tu email...").
- `mockups/verify-email.html:58-71` — Estado 2 "Éxito" (ícono `ri-checkbox-circle-fill` verde + botón "Ir a mi dashboard" enlazando a `dashboard-user.html`).
- `mockups/verify-email.html:73-87` — Estado 3 "Expirado" (ícono `ri-time-line` amarillo + botón "Reenviar email" + link "contáctanos").
- `mockups/verify-email.html:31-39` — Navbar reutilizable.
- `mockups/verify-email.html:92-117` — Footer reutilizable (layout idéntico al resto del sitio).

## Alternativas consideradas

### Opción A — SSR puro: el servidor confirma y renderiza el estado final
- La página `/verify-email/[token].astro` ejecuta `GET /api/v1/auth/verify-email/:token` en el servidor y muestra directamente Éxito o Expirado.
- Pro: una sola request, no se necesita JS en cliente, SEO/UX impecable, no se ve el spinner.
- Contra: pierde el estado "Verificando" del mockup (línea 46-56); si el usuario refresca, ya no hay token vigente y verá Expirado falsamente (requiere idempotencia → se cubre con escenario `already_verified`).

### Opción B — Cliente fetch: la página monta el estado "Verificando" y llama al endpoint vía JS
- La página renderiza Estado 1 (spinner) y un script de isla llama al endpoint y conmuta a Éxito o Expirado.
- Pro: respeta los 3 estados del mockup; flexible para reintentos visuales.
- Contra: requiere isla cliente, expone el token en JS, peor para usuarios con JS desactivado, request extra.

### Opción C — SSR con spinner como fallback de noscript / pre-render
- Renderiza el spinner durante el SSR mientras se ejecuta la verificación en el mismo handler y se entrega la respuesta final con un `<meta http-equiv="refresh">` mínimo o `Astro.redirect`.
- Pro: visualmente híbrido.
- Contra: complica el flujo sin ganancia real (la latencia del endpoint es < 100 ms en happy path).

## Decisión

Se elige **Opción A**. El estado "Verificando" tiene baja utilidad real con SSR rápido en Cloudflare Workers. Implementaremos Éxito (mockup líneas 58-71) y Expirado (líneas 73-87) en el `.astro`; el Estado 1 del mockup se documenta como "preview de estados" tal como ya lo aclara el propio mockup en su línea 44. Se mantiene el endpoint `GET` separado para reutilización desde tests y para idempotencia.

## Riesgos y mitigaciones

- Riesgo: usuario abre dos veces el link → segunda llamada con token ya eliminado y `email_verified_at` no nulo → se confunde con "expirado". Mitigación: detectar `users.email_verified_at != null` ANTES de exigir token y responder `{ already_verified: true }` 200, renderizando estado Éxito.
- Riesgo: ataque de enumeración de tokens. Mitigación: respuesta neutra 410 para cualquier token inexistente o expirado, sin distinguir motivos; rate limit IP por endpoint.
- Riesgo: discrepancia entre TTL KV y `expires_at` interno. Mitigación: usar exclusivamente la presencia en KV como fuente de verdad; ignorar `expires_at` para la decisión, solo registrarlo en auditoría.

## Métrica de éxito

- Tasa de confirmaciones exitosas (`200` con `email_verified_at` recién seteado) sobre emails enviados ≥ 70% dentro de 24 h.
- 0 incidentes de usuarios "verificados" cuyo `email_verified_at` quedó `null`.
- Tiempo p95 del endpoint < 300 ms.
