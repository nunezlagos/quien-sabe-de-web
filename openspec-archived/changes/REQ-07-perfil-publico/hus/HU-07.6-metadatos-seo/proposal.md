# Propuesta — HU-07.6 — Metadatos SEO en perfiles públicos

**Estado:** propuesta | **REQ padre:** REQ-07-perfil-publico

## Contexto

Los perfiles públicos son la unidad compartible de la plataforma. Cuando un vecino comparte un enlace a `/p/juan-gasfiter-las-condes` por WhatsApp, redes sociales o email, el destino debe previsualizarse con título, descripción e imagen correctos. Además, los datos estructurados `JSON-LD` tipo `LocalBusiness` permiten que Google entienda el negocio y lo muestre en Knowledge Panel / resultados locales. Esta HU añade `og:title`, `og:description`, `og:image` y un bloque `JSON-LD` a la vista SSR del perfil. Si el prestador no tiene foto, `og:image` cae a `/og-default.png`.

## Mockups de referencia

- `mockups/profile.html:5-7` — head con `title` y `meta description` del mockup (referencia de dónde van los meta tags).
- `mockups/about.html` y `mockups/transparency.html` —usan la misma nav/footer; útil como referencia para confirmar que el meta no rompe el render (no leídos línea por línea acá).
- No existe mockup dedicado para meta tags; el patrón se define en el estándar Open Graph.

## Alternativas consideradas

### Opcion A — Componente `SeoMeta.astro` con `og:*` + `JSON-LD` calculado en SSR
- Helper `buildJsonLd(provider): string` que serializa el DTO al shape `LocalBusiness` de schema.org.
- Helper `buildOgMeta(provider): { title, description, image }` con truncado a 160 chars.
- Componente que renderiza los `<meta>` y `<script type="application/ld+json">` en el `<head>`.
- Pro: 100% SSR, sin JS adicional.
- Pro: el JSON-LD es testeable como string.
- Contra: cambio de contrato schema.org requiere migración manual.

### Opcion B — Generar meta tags en cliente con JS
- Hidratación que lee `data-provider='...'` y escribe meta tags.
- Pro: el HTML inicial queda más limpio.
- Contra: crawlers (Facebook, Twitter, Googlebot) no ejecutan JS → previsualización rota.
- Contra: viola criterio de aceptación.

### Opcion C — Sin JSON-LD, sólo `og:*`
- Más simple.
- Contra: pierde Knowledge Panel / rich snippets.

## Decision

Se elige **Opcion A**. Es la única opción que cumple "SEO" real (crawlers no ejecutan JS). El JSON-LD es pequeño y se mantiene en un helper testeable. La imagen por defecto `/public/og-default.png` se agrega como asset estático.

## Riesgos y mitigaciones

- Riesgo: `JSON-LD` mal formado hace que Google lo ignore silenciosamente → Mitigación: tests que parsean con `JSON.parse` y validan shape mínimo; validar contra schema.org LocalBusiness en tests E2E con la herramienta oficial (mockeada o vía validador externo en CI manual).
- Riesgo: `og:image` apunta a URL R2 expirada → Mitigación: regenerar signed URL con TTL 7d en cada SSR; el endpoint de HU-07.1 ya devuelve URL firmada.
- Riesgo: la descripción excede 160 chars → Mitigación: truncar a 157 + `...`.
- Riesgo: meta tags duplicados si la página también tiene otros `<meta property="og:*">` globales → Mitigación: usar IDs únicos (`property="og:title" data-profile="true"`) y validar que no hay duplicados en tests E2E.

## Metrica de exito

- `curl /p/juan-gasfiter-las-condes | grep 'og:title'` → 1 ocurrencia con `content="Juan — Gasfíter en Las Condes"`.
- `curl /p/juan-gasfiter-las-condes | grep 'og:description'` → 1 ocurrencia con `content` truncado a 160 chars máx.
- `curl /p/juan-gasfiter-las-condes | grep 'og:image'` → URL firmada R2 (o `/og-default.png` si no hay foto).
- `curl /p/juan-gasfiter-las-condes | grep 'application/ld+json'` → JSON parseable con `@type: "LocalBusiness"`.
- `curl /p/juan-gasfiter-las-condes | grep -c 'og:'` ≤ 5 (title, description, image, url, type).
