# Propuesta — HU-08.3 — Botones de contacto wireados con sendBeacon

**Estado:** propuesta | **REQ padre:** REQ-08-contacto-tracking

## Contexto

Cada botón de contacto debe registrar el evento ANTES de salir al destino externo (`wa.me`, `mailto:`, `tel:`). El navegador puede abandonar la página inmediatamente y matar requests `fetch` normales. La solución estándar es `navigator.sendBeacon`: fire-and-forget que sobrevive a la navegación. Crítico para OE2 — sin esto, las métricas se subestiman.

## Mockups de referencia

- `mockups/profile.html:93-95` — botón WhatsApp del perfil público (`#profile-whatsapp-btn`).
- `mockups/profile.html:96-98` — botón email del perfil (`#profile-email-btn`).
- `mockups/index.html:369-371` — botón WhatsApp circular en cards (`.whatsapp-link`).
- `mockups/index.html:417-422` — botones WhatsApp/email en `#list-card-template` (`.whatsapp-link`, `.email-link`).
- `mockups/js/profile.js:27` — asignación actual `href = https://wa.me/<num>` (sin tracking).
- `mockups/js/profile.js:32` — asignación actual `href = mailto:<email>` (sin tracking).
- `mockups/js/home.js:203-212` — asignación equivalente en cards del home.

## Alternativas consideradas

### Opcion A — `navigator.sendBeacon` antes de navegar
- Listener `click` que invoca `sendBeacon` con payload JSON y deja propagarse el evento.
- Pro: API diseñada exactamente para este caso (telemetría pre-unload).
- Pro: no bloquea la navegación si el endpoint responde lento o falla.
- Contra: payload máximo 64 KB (irrelevante aquí: <100 bytes).
- Contra: no expone respuesta del servidor (no se necesita).

### Opcion B — `fetch` con `keepalive: true` y `event.preventDefault()`
- Disparar `fetch(..., { keepalive: true })`, esperar a que resuelva, luego `window.location.href = href`.
- Pro: permite leer status code.
- Contra: `keepalive` tiene límite estricto (64 KB total agregado por origen).
- Contra: bloquea milisegundos al usuario; si el endpoint cae, hay riesgo de bloquear el redirect.

### Opcion C — Pixel tracking (img.src = endpoint)
- Insertar un `<img>` apuntando al endpoint.
- Pro: cero JS adicional.
- Contra: sólo soporta GET; nuestro endpoint es POST por diseño (privacidad: no metemos `provider_id` en query string + access logs).

## Decision

Se elige **Opcion A** (`sendBeacon`). Cumple los tres criterios Gherkin (registra antes del redirect, no bloquea, sobrevive a fallos del backend). Es la elección documentada como recomendada por MDN para este caso de uso.

## Riesgos y mitigaciones

- Riesgo: `sendBeacon` no disponible en navegadores muy viejos → Mitigación: feature-detect con `if ('sendBeacon' in navigator)`; fallback a `fetch` con `keepalive`; en último caso, dejar pasar el redirect sin tracking.
- Riesgo: middle-click / cmd-click abre en nueva pestaña sin disparar el listener estándar → Mitigación: listener en `auxclick` además de `click`; documentar que el comportamiento es best-effort.
- Riesgo: el botón puede tener `target="_blank"` (ver `mockups/profile.html:93`) y el navegador prioriza la apertura → Mitigación: `sendBeacon` es síncrono desde el lado JS (la cola se entrega aunque el documento muera).
- Riesgo: payload mal formado → Mitigación: validar tipos en cliente antes de `JSON.stringify`.

## Metrica de exito

- Test E2E Playwright: clic en `#profile-whatsapp-btn` produce 1 request POST a `/api/v1/contacts/track` con `kind: "whatsapp"` y abre `https://wa.me/...`.
- Test E2E: si el endpoint devuelve 500, el redirect ocurre igual.
- Inspector de red en navegador muestra status 204 en clicks reales.
