# Propuesta — HU-17.3 — Template de bienvenida

**Estado:** propuesta | **REQ padre:** REQ-17-notificaciones-email

## Contexto

Tras registrarse, el usuario debe recibir un email de bienvenida. Esta HU
define el template `welcome` con dos variantes (HTML y texto plano), el
helper de render con escape de variables (defensa contra XSS vía
`{{name}}`), y la integración con `EmailService.send` para que se dispare
automáticamente al final de `POST /api/v1/auth/register`. El escape es
crítico: el nombre viene del input del usuario y se renderiza literal en
HTML; sin escape, `<script>alert(1)</script>` se ejecuta en el cliente de
correo (Gmail lo sanitiza, pero otros no).

## Mockups de referencia

No aplica. Template HTML no se visualiza en mockups.

## Alternativas consideradas

### Opcion A — Templates en TypeScript como funciones puras `(vars) => string`
- `welcome.html.ts` y `welcome.txt.ts` exportan funciones que reciben
  `{ name, role, loginUrl }` y retornan string con escape aplicado.
- Helper `renderTemplate(name, vars)` despacha al template correcto.
- Pro: tipado fuerte, fácil de testear, sin runtime extra, sin compilación MDX.
- Pro: escape centralizado en un helper.
- Contra: el editor copy debe tocar código TS, no Markdown.

### Opcion B — MJML o JSX-Email
- MJML genera HTML responsive a partir de un DSL.
- Pro: HTML responsive robusto out-of-the-box.
- Contra: dependencia pesada, build extra, overkill para emails transaccionales simples.

### Opcion C — Markdown procesado con `marked` + `juice`
- Markdown simple, juice inlinea CSS.
- Pro: editor escribe Markdown, menos código TS.
- Contra: `juice` no es trivial en edge runtime; menos control sobre el HTML final; el escape se complica.

## Decision

Se elige **Opcion A**. Los templates son funciones puras tipadas; el escape
es un helper compartido (`escapeHtml`) usado por todas las variantes HTML.
El copy lo escribe un dev en PR, no un editor externo; consistente con el
resto del proyecto (Markdown se valida en build, no en runtime).

## Riesgos y mitigaciones

- Riesgo: XSS vía `name` malicioso → Mitigación: `escapeHtml` reemplaza `<>&"'` por entidades antes de interpolación; test cubre `<script>alert(1)</script>`.
- Riesgo: el template usa URLs absolutas hardcodeadas al entorno → Mitigación: `vars.loginUrl` se pasa desde el caller, basado en `Astro.url.origin` en runtime.
- Riesgo: el email llega sin "List-Unsubscribe" → Mitigación: fuera de scope para bienvenida (no es email marketing); REQ-17 no incluye header; documentar.

## Metrica de exito

- Tras `POST /api/v1/auth/register` con `{ name: "Ana" }`, Mailpit recibe 1 mensaje con `Subject` conteniendo "Bienvenida" y body HTML con "Hola Ana".
- Test con `name = "<script>alert(1)</script>"` produce HTML con `&lt;script&gt;...&lt;/script&gt;` (escaped).
- `Content-Type: multipart/alternative` con ambas variantes (HTML y text).
