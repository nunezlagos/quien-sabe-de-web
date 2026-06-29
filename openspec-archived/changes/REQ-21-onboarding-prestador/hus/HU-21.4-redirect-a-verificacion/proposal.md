# Propuesta — HU-21.4 — Redirect post-wizard a /verification

**Estado:** propuesta | **REQ padre:** REQ-21-onboarding-prestador

## Contexto

Una vez que el endpoint de HU-21.3 responde 201 con `status: "pending_verification"`, el cliente necesita navegar al flujo de verificación (REQ-03). El mockup `mockups/create-trade.html:50` apunta a `dashboard-provider.html`, pero la nueva regla del REQ-21 es enviar al usuario a `/verification` directamente para reducir fricción: el prestador termina el wizard y ya está en la página de subida de certificado. Esta HU implementa el cliente JS que dispara el POST, gestiona el redirect y maneja errores con toast.

## Mockups de referencia

- `mockups/create-trade.html:50` — `<form action="dashboard-provider.html">` legacy; esta HU cambia el flujo para apuntar a `/verification`.
- `mockups/profile.html` — patrón de notificación flotante (toast) para errores (no hay ejemplo exacto, se reutiliza el estilo `bg-white shadow-lg border border-gray-100 rounded-2xl` consistente con el sitio).
- `mockups/verification.html` — destino del redirect; hero `bg-primary text-white` con CTA "Subir Certificado".

## Alternativas consideradas

### Opción A — Cliente JS vanilla con `fetch` + `window.location.assign`
- Bloque `<script>` al final de `create-trade.astro` que intercepta el submit, hace `fetch('/api/v1/providers/me', { method: 'POST', body: ... })` y en 201 hace `window.location.assign('/verification')`.
- Pro: cero dependencias; se integra con el HTML estático de HU-21.1.
- Pro: el toast se renderiza con el mismo set de clases que el resto del sitio.
- Contra: el form nativo se rompe si JS está deshabilitado → Mitigación: mantener `action="/api/v1/providers/me" method="POST"` como fallback; si JS deshabilitado, el form hace POST tradicional y el endpoint responde 201 + el browser navega al JSON (subóptimo pero no rompe).

### Opción B — Usar `<form action="/api/v1/providers/me" method="POST">` nativo sin JS
- Pro: funciona sin JS.
- Contra: el server devuelve 201 JSON, no un redirect 30x, así que el browser muestra el JSON literal como texto. Mala UX.

### Opción C — Astro server actions (acción server-only)
- Pro: tipado end-to-end.
- Contra: Astro server actions no están maduras en la versión del proyecto; introducen riesgo.

## Decisión

Se elige **Opción A**. Es la implementación más alineada con el resto del sitio (otros flujos como "Crear Ticket" en `mockups/dashboard-provider.html:533-541` usan vanilla JS) y permite extender el manejo de errores con toast sin nuevos componentes.

## Riesgos y mitigaciones

- Riesgo: si JS falla a mitad de submit (red caída, timeout), el usuario queda sin feedback → Mitigación: `try/catch` + listener `unhandledrejection` que muestra toast rojo "Algo salió mal, intenta de nuevo".
- Riesgo: el POST tradicional (fallback sin JS) muestra JSON al usuario → Mitigación: agregar `Astro.middleware` que tras POST a `/api/v1/providers/me` con `Accept: text/html` devuelve redirect 303; documentar como follow-up menor.
- Riesgo: doble submit si el usuario clickea dos veces → Mitigación: disable del botón submit durante el fetch (`button.disabled = true` + texto "Enviando...").

## Métrica de éxito

- E2E Playwright: login → submit válido → URL final es `/verification`.
- E2E Playwright: submit con 5xx simulado → permanece en `/create-trade` con toast rojo visible.
- E2E Playwright: doble click rápido → un solo POST sale a la red (segundo click ignorado).
- Sabotaje: comentar el `window.location.assign('/verification')` → E2E verifica URL final `/create-trade` → restaurar.