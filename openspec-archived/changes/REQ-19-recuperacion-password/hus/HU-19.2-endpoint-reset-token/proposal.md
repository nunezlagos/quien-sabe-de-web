# Propuesta — HU-19.2 — Validar token de reset vigente

**Estado:** propuesta | **REQ padre:** REQ-19-recuperacion-password

## Contexto

Cuando el usuario hace click en el link del email, llega a `/reset/:token`.
Antes de mostrarle el form para escribir el nuevo password, la página debe
validar que el token existe y no expiró. Esto evita que el usuario pierda
tiempo escribiendo un password que después se rechazará. La validación se
expone como endpoint `GET /api/v1/auth/reset/:token` que retorna 200 con
email enmascarado si el token es válido, o 410 si no lo es. La página
`/reset/:token` consume ese endpoint en SSR y muestra el form o el estado
de error.

## Mockups de referencia

- `mockups/reset-password.html:77-88` — estado de error "Este enlace
  expiró" con CTA "Solicitar nuevo enlace"; el patrón reusable está en
  `mockups/profile.html` secciones `#profile-error` (líneas 165-169
  aproximadamente) — card centrado, ícono rojo, texto gris y link
  primario. La HU referencia este estilo (las líneas del mockup son
  aproximadas, el patrón es lo que importa).

## Alternativas considered

### Opcion A — Endpoint público GET + SSR fetch
- `GET /api/v1/auth/reset/:token` con auth público.
- `src/pages/reset/[token].astro` con `export const prerender = false` que hace `fetch` al endpoint en SSR.
- Pro: simple, sin coupling a KV desde la vista.
- Pro: el endpoint puede ser consumido por apps móviles o integraciones en el futuro.
- Contra: doble hop (SSR → endpoint → KV). Mitigar cacheando el response 5s en KV.

### Opcion B — Lectura directa de KV en la vista
- `src/pages/reset/[token].astro` lee `Astro.locals.runtime.env.SESSION` directo.
- Pro: 0 hops extra.
- Contra: acopla la vista a KV; menos testeable; no permite exponer el endpoint.

### Opcion C — Validar client-side con JS
- La vista hace fetch al endpoint, JS togglea el form.
- Pro: 0 SSR.
- Contra: usuarios con JS deshabilitado no pueden resetear; además ya tenemos la infra SSR.

## Decision

Se elige **Opcion A**. El endpoint público es reusable, testeable, y
encapsula la lógica de "leer KV y validar expiración" en un servicio. La
vista solo hace fetch en SSR. El estado de error reusa el patrón de
`mockups/profile.html` (card centrado, ícono, link).

## Riesgos y mitigaciones

- Riesgo: el endpoint revela si el email existe (mascarado o no) → Mitigación: el email devuelto va enmascarado (`ve***@example.com`) para que un atacante que reciba un token válido no gane info nueva.
- Riesgo: KV race (token existe justo cuando expiramos) → Mitigación: leer con `kv.getWithMetadata` para inspeccionar la fecha; si `Date.now()/1000 > expiresAt` retornar 410. KV de Cloudflare respeta TTL por lo que la fila no debería estar, pero defensa redundante.
- Riesgo: enumeración de tokens vía 200 vs 410 → Mitigación: 410 para "no existe" y para "expirado" (mismo response); no se distingue.

## Metrica de exito

- `GET /api/v1/auth/reset/abc123` con token vigente → 200, `{ valid:true, user_email_masked:"ve***@example.com" }`.
- Token inexistente o expirado → 410, `{ error: "token inválido o expirado" }`.
- `src/pages/reset/abc123.astro` con token válido → renderiza form; con token inválido → renderiza card de error.
